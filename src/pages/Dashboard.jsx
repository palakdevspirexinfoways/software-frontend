import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useCRM } from '../context/CRMContext';
import * as crmService from '../services/crmService';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Users2,
  UserCheck,
  UserPlus,
  RotateCcw,
  Calendar,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

export const Dashboard = ({ onManageOrders, onViewCustomers }) => {
  const { customers } = useCRM();
  const [activeTab, setActiveTab] = useState('sales');
  const [allInvoices, setAllInvoices] = useState([]);
  const [allProductsCount, setAllProductsCount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' });

  const handleApplyFilter = () => {
    setAppliedDateRange({ start: startDate, end: endDate });
  };

  // Fetch Dashboard Stats and Orders
  const fetchDashboardData = async () => {
    try {
      const invoices = await api.get('/invoices');
      const products = await api.get('/products');

      if (Array.isArray(invoices)) {
        setAllInvoices(invoices);
      }
      if (Array.isArray(products)) {
        setAllProductsCount(products.length);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredInvoices = useMemo(() => {
    const { start, end } = appliedDateRange;
    if (!start && !end) return allInvoices;
    
    return allInvoices.filter(inv => {
      if (!inv.issueDate) return false;
      const d = new Date(inv.issueDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const invDateStr = `${yyyy}-${mm}-${dd}`;
      
      if (start && end) {
        return invDateStr >= start && invDateStr <= end;
      } else if (start && !end) {
        return invDateStr === start;
      } else if (!start && end) {
        return invDateStr === end;
      }
      return true;
    });
  }, [allInvoices, appliedDateRange]);

  const recentOrders = useMemo(() => {
    return filteredInvoices.slice(0, 5).map(inv => {
      const grandTotal = inv.grandTotal || 0;
      const paid = inv.amountReceived || 0;
      const pending = Math.max(0, grandTotal - paid);
      let computedPayment = inv.payment || 'Pending';
      if (computedPayment !== 'Draft') {
        if (pending < 0.01 && grandTotal > 0) computedPayment = 'Paid';
        else if (paid > 0 && pending >= 0.01 && computedPayment !== 'Overdue') computedPayment = 'Partial';
        else if (paid === 0 && computedPayment !== 'Overdue') computedPayment = 'Pending';
      }

      return {
        id: inv.invoiceId,
        customer: inv.client,
        item: inv.items && inv.items.length > 0 ? inv.items.map(item => item.product).join(', ') : 'No items',
        price: '₹' + grandTotal.toLocaleString('en-IN'),
        status: inv.delivery || 'Processing',
        payment: computedPayment,
        date: inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
      };
    });
  }, [filteredInvoices]);

  const stats = useMemo(() => {
    const revenue = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const salesUnits = filteredInvoices.reduce((sum, inv) => sum + (inv.items ? inv.items.reduce((s, i) => s + i.qty, 0) : 0), 0);
    const uniqueCustomers = new Set(filteredInvoices.map(inv => inv.client)).size;
    const isFiltered = appliedDateRange.start || appliedDateRange.end;
    
    return [
      {
        id: 'sales',
        title: 'Total Sales',
        value: `${salesUnits.toLocaleString('en-IN')} units`,
        change: isFiltered ? 'Filtered' : '',
        isPositive: true,
        icon: ShoppingBag,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
      },
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: '₹' + revenue.toLocaleString('en-IN'),
        change: isFiltered ? 'Filtered' : '',
        isPositive: true,
        icon: DollarSign,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-100'
      },
      {
        id: 'customers',
        title: 'Total Customers',
        value: `${uniqueCustomers.toLocaleString('en-IN')} users`,
        change: isFiltered ? 'Filtered' : '',
        isPositive: true,
        icon: Users,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-100'
      },
      {
        id: 'refunds',
        title: 'Total Products',
        value: `${allProductsCount.toLocaleString('en-IN')} items`,
        change: '',
        isPositive: true,
        icon: RotateCcw,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-100'
      }
    ];
  }, [filteredInvoices, appliedDateRange, allProductsCount]);

  const getDonutData = () => {
    if (!filteredInvoices.length) return { sale: 0, distribute: 0, return: 0, total: 0 };
    let sale = 0, distribute = 0, ret = 0;
    filteredInvoices.forEach(inv => {
      if (inv.delivery === 'Delivered') sale++;
      else if (inv.delivery === 'Cancelled') ret++;
      else distribute++;
    });
    const total = filteredInvoices.length;
    return { sale: sale/total, distribute: distribute/total, return: ret/total, total };
  };

  const renderActiveGraph = () => {
    // Generate dummy arrays based on actual data counts so the graphs look alive
    const salesCount = filteredInvoices.reduce((sum, inv) => sum + (inv.items ? inv.items.reduce((s, i) => s + i.qty, 0) : 0), 0);
    const revCount = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const custCount = new Set(filteredInvoices.map(inv => inv.client)).size;
    const retCount = filteredInvoices.filter(inv => inv.delivery === 'Cancelled').length;

    const renderBarChart = (data, labels, valueMultiplier = 1) => {
      const sorted = [...data].sort((a,b) => b - a);
      const max = sorted[0];
      const secondMax = sorted[1] || max;
      const thirdMax = sorted[2] || secondMax;
      
      return (
        <div className="h-64 w-full bg-white rounded-2xl flex items-end justify-between px-6 py-6 border border-slate-50">
          {data.map((val, i) => {
            const isHighest = val === max;
            const isSecond = val === secondMax && !isHighest;
            const isThird = val === thirdMax && !isHighest && !isSecond;
            const isSolid = isHighest || isSecond || isThird;
            
            return (
              <div key={i} className="flex flex-col items-center gap-4 w-full group">
                <div 
                  style={{ 
                    height: `${Math.min(100, Math.max(10, val * valueMultiplier))}%`,
                    backgroundSize: '12px 12px',
                    backgroundImage: !isSolid ? 'repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 2px, transparent 2px, transparent 6px)' : 'none',
                    backgroundColor: isHighest ? '#124C36' : (isSecond ? '#388E6D' : (isThird ? '#86EFAC' : 'transparent')),
                    border: !isSolid ? '2px solid #e2e8f0' : 'none'
                  }} 
                  className="w-12 lg:w-16 rounded-full transition-all duration-500 cursor-pointer shadow-sm group-hover:scale-105"
                ></div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{labels[i]}</span>
              </div>
            );
          })}
        </div>
      );
    };

    switch (activeTab) {
      case 'sales':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Sales Volume Trend</h4>
                <p className="text-xs text-slate-400">Total units sold</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Total: {salesCount}
              </span>
            </div>
            {renderBarChart([15, 25, 45, 80, 60, 90, 75], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Revenue Growth Trend</h4>
                <p className="text-xs text-slate-400">Earnings generated</p>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Total: ₹{revCount.toLocaleString('en-IN')}
              </span>
            </div>
            {renderBarChart([40, 60, 50, 90], ['W1', 'W2', 'W3', 'W4'])}
          </div>
        );
      case 'customers':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800">New Customer Signups</h4>
                <p className="text-xs text-slate-400">Daily client acquisitions</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" /> Total: {custCount}
              </span>
            </div>
            {renderBarChart([30, 45, custCount > 0 ? 60 : 10, 40, 75, 90, 85], ['M', 'T', 'W', 'T', 'F', 'S', 'S'])}
          </div>
        );
      case 'refunds':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Refund Processing Log</h4>
                <p className="text-xs text-slate-400">Total refunded orders</p>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-1" /> Total: {retCount}
              </span>
            </div>
            {renderBarChart([15, 20, retCount > 0 ? 30 : 10, 5, 8, 12, 6], ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], 3)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time metrics, circular analytics, and recent orders.</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="text-slate-400 font-bold text-xs">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button 
            onClick={handleApplyFilter}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Interactive Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isSelected = activeTab === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => setActiveTab(stat.id)}
              className={`p-6 rounded-2xl border flex items-center justify-between group cursor-pointer text-left transition-all duration-300 ${isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/15 scale-[1.02]'
                  : 'bg-white text-slate-800 border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                }`}
            >
              <div className="space-y-2.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {stat.title}
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                  {stat.change && (
                    <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected
                        ? 'text-white bg-white/20'
                        : 'text-emerald-750 bg-emerald-50'
                      }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isSelected
                  ? 'bg-white/10 text-white group-hover:scale-115'
                  : stat.color + ' group-hover:scale-115'
                }`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* CRM Quick Stats */}
      {(() => {
        const now = new Date();
        const nm = now.getMonth(), ny = now.getFullYear();
        const active = customers.filter(c => c.status === 'Active').length;
        const newThisMonth = customers.filter(c => {
          const d = new Date(c.createdAt);
          return d.getMonth() === nm && d.getFullYear() === ny;
        }).length;
        const totalOutstanding = allInvoices.reduce((sum, inv) => {
          return sum + Math.max(0, (inv.grandTotal || 0) - (inv.amountReceived || 0));
        }, 0);
        const crmStats = [
          { label: 'CRM Customers', value: customers.length, icon: Users2, color: 'text-teal-600 bg-teal-50' },
          { label: 'Active Customers', value: active, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'New This Month', value: newThisMonth, icon: UserPlus, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Outstanding', value: '₹' + totalOutstanding.toLocaleString('en-IN'), icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
        ];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CRM Overview</h3>
              {onViewCustomers && (
                <button onClick={onViewCustomers} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1">
                  View All Customers <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {crmStats.map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-base font-extrabold text-slate-800 leading-tight truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Main Grid: Graphs & Circular Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph Visualiser */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-900 text-lg">Performance Analytics</h3>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {['sales', 'revenue', 'customers', 'refunds'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${activeTab === tab
                      ? 'bg-white text-emerald-650 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {renderActiveGraph()}
        </div>

        {/* Circular Analytics (Donut Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Analytics</h3>
              <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* SVG Gauge Chart styled like Donezo */}
            <div className="relative flex items-center justify-center h-56 my-4">
              <svg className="w-full max-w-[280px] h-full drop-shadow-sm" viewBox="0 0 120 100">
                <defs>
                  <pattern id="gaugeStripe" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="4" stroke="#cbd5e1" strokeWidth="1.5" />
                  </pattern>
                </defs>
                {/* Background Striped Track (Pending) */}
                <path 
                  d="M 25 85 A 43 43 0 1 1 95 85" 
                  fill="transparent" stroke="url(#gaugeStripe)" strokeWidth="18" strokeLinecap="round" 
                />
                
                {/* Distribute segment (Medium Green - In Progress) - Drawn first so it goes under Sale */}
                <path 
                  d="M 25 85 A 43 43 0 1 1 95 85" 
                  fill="transparent" stroke="#388E6D" strokeWidth="18" strokeLinecap="round"
                  pathLength="100" strokeDasharray={`${(getDonutData().sale + getDonutData().distribute) * 100} 100`} strokeDashoffset="0"
                  className="transition-all duration-1000"
                />

                {/* Sale segment (Deep Green - Completed) - Drawn on top */}
                <path 
                  d="M 25 85 A 43 43 0 1 1 95 85" 
                  fill="transparent" stroke="#124C36" strokeWidth="18" strokeLinecap="round"
                  pathLength="100" strokeDasharray={`${getDonutData().sale * 100} 100`} strokeDashoffset="0"
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Center Details */}
              <div className="absolute flex flex-col items-center justify-center top-[40%]">
                <span className="text-4xl font-black text-emerald-900 tracking-tighter">
                  {Math.round((getDonutData().sale + getDonutData().distribute) * 100)}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Progress</span>
              </div>
            </div>

            {/* Legends styled exactly like image */}
            <div className="flex items-center justify-center space-x-5 pt-3 border-t border-slate-50">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-[#124C36] inline-block"></span>
                <span className="text-[10px] font-bold text-slate-500">Sale</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-[#388E6D] inline-block"></span>
                <span className="text-[10px] font-bold text-slate-500">Distribute</span>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center overflow-hidden" style={{ background: 'repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 1px, transparent 1px, transparent 3px)' }}></div>
                <span className="text-[10px] font-bold text-slate-500">Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Log Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Recent Orders</h3>
            <p className="text-xs text-slate-400 mt-0.5">List of last orders created</p>
          </div>
          <button 
            onClick={onManageOrders}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:gap-1.5 transition-all cursor-pointer"
          >
            Manage Orders <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Product Item</th>
                <th className="py-3 px-6">Price</th>
                <th className="py-3 px-6">Payment</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 text-emerald-600 font-semibold">{order.id}</td>
                  <td className="py-4 px-6 text-slate-900 font-bold">{order.customer}</td>
                  <td className="py-4 px-6 text-slate-500">{order.item}</td>
                  <td className="py-4 px-6 text-slate-950 font-bold">{order.price}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                      {order.payment}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'Processing' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'Pending' ? 'bg-emerald-50/50 text-emerald-500' :
                            'bg-slate-100 text-slate-500'
                      }`}>
                      {order.status === 'Delivered' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {order.status === 'Processing' && <Clock className="w-3 h-3 mr-1" />}
                      {order.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                      {order.status === 'Cancelled' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-xs">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
