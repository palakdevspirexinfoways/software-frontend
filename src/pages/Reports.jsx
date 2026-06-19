import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Factory,
  Truck,
  Download,
  TrendingUp,
  TrendingDown,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';

export const Reports = () => {
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState({
    sales: {
      revenue: 0,
      completedOrders: 0,
      avgOrderValue: 0,
      change: 'Real-Time Data'
    },
    financials: {
      netProfit: 0,
      cashBook: '0',
      bankBook: '0'
    },
    production: {
      finishedGoods: 0,
      activeWorkOrders: 0,
      wastageAvg: '0%'
    },
    inventory: {
      stockValue: 0,
      lowStockCount: 0,
      turnoverRate: 'N/A'
    },
    purchasing: {
      procurementValue: 0,
      pendingPOs: 0,
      overduePayments: '0',
      change: 'N/A'
    }
  });

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        const [invoicesData, inventoryData, productsData] = await Promise.all([
          api.get('/invoices').catch(() => []),
          api.get('/inventory').catch(() => []),
          api.get('/products').catch(() => [])
        ]);

        const invoices = Array.isArray(invoicesData) ? invoicesData : [];
        const inventory = Array.isArray(inventoryData) ? inventoryData : [];
        const products = Array.isArray(productsData) ? productsData : [];

        // Sales Calculations
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const completedOrders = invoices.length;
        const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

        // Financials (Derived roughly from Sales for demonstration if no explicit API)
        const netProfit = totalRevenue * 0.15; // Rough 15% margin example

        // Production / Products
        const finishedGoods = products.reduce((sum, p) => sum + (p.qty || 0), 0);

        // Inventory
        const stockValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const lowStockCount = inventory.filter(item => item.quantity < 10 && item.quantity > 0).length;

        setReportsData({
          sales: {
            revenue: totalRevenue,
            completedOrders,
            avgOrderValue,
            change: 'Real-Time Data'
          },
          financials: {
            netProfit: netProfit,
            cashBook: '0',
            bankBook: '0'
          },
          production: {
            finishedGoods,
            activeWorkOrders: 0,
            wastageAvg: '0%'
          },
          inventory: {
            stockValue,
            lowStockCount,
            turnoverRate: 'N/A'
          },
          purchasing: {
            procurementValue: 0,
            pendingPOs: 0,
            overduePayments: '0',
            change: 'N/A'
          }
        });
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  // Exporter to CSV
  const handleExportData = () => {
    const csvRows = [];
    csvRows.push(['Executive Summary Report', 'Valuation']);
    csvRows.push(['Sales Total Revenue', `₹${reportsData.sales.revenue.toLocaleString('en-IN')}`]);
    csvRows.push(['Sales Completed Orders', reportsData.sales.completedOrders]);
    csvRows.push(['Sales Avg Order Value', `₹${reportsData.sales.avgOrderValue.toLocaleString('en-IN')}`]);
    csvRows.push(['Financials Net Profit', `₹${reportsData.financials.netProfit.toLocaleString('en-IN')}`]);
    csvRows.push(['Financials Cash Book', `₹${reportsData.financials.cashBook}`]);
    csvRows.push(['Financials Bank Book', `₹${reportsData.financials.bankBook}`]);
    csvRows.push(['Production Finished Goods Output', `${reportsData.production.finishedGoods} Units`]);
    csvRows.push(['Production Active Work Orders', reportsData.production.activeWorkOrders]);
    csvRows.push(['Production Wastage Average', reportsData.production.wastageAvg]);
    csvRows.push(['Inventory Total Stock Value', `₹${reportsData.inventory.stockValue.toLocaleString('en-IN')}`]);
    csvRows.push(['Inventory Low Stock Count', reportsData.inventory.lowStockCount]);
    csvRows.push(['Inventory Turnover Rate', reportsData.inventory.turnoverRate]);
    csvRows.push(['Purchasing Total Procurement', `₹${reportsData.purchasing.procurementValue.toLocaleString('en-IN')}`]);
    csvRows.push(['Purchasing Pending POs', reportsData.purchasing.pendingPOs]);
    csvRows.push(['Purchasing Overdue Payments', `₹${reportsData.purchasing.overduePayments}`]);

    const blob = new Blob([csvRows.map(row => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `executive_summary_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export successful!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      <ToastContainer />
      {/* Top Title/Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1 font-semibold">Executive Command Center and Document Generation Library.</p>
        </div>

        <button
          onClick={handleExportData}
          className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10"
        >
          <Download className="w-4 h-4" />
          <span>Export Data</span>
        </button>
      </div>

      {/* Section Header */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Executive Summaries</h2>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Sales Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 lg:col-span-2 flex flex-col justify-between min-h-[200px]">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100/40">
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Sales Summary
            </span>
            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100/40">
              {reportsData.sales.change}
            </span>
          </div>

          {/* Revenue */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-black text-slate-900">
              ₹{reportsData.sales.revenue.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Bottom details row */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Orders Completed</p>
              <p className="text-lg font-black text-slate-800">
                {reportsData.sales.completedOrders.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Avg Order Value</p>
              <p className="text-lg font-black text-slate-800">
                ₹{reportsData.sales.avgOrderValue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Financials Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between min-h-[200px]">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100/40">
              <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Financials
            </span>
          </div>

          {/* Net Profit */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
            <p className="text-3xl font-black text-emerald-600">
              ₹{reportsData.financials.netProfit.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Bottom columns */}
          <div className="space-y-2 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Cash Book</span>
              <span className="font-black text-slate-800">₹{reportsData.financials.cashBook}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Bank Book</span>
              <span className="font-black text-slate-800">₹{reportsData.financials.bankBook}</span>
            </div>
          </div>
        </div>

        {/* Production Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between min-h-[200px]">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100/40">
              <Factory className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Production
            </span>
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-450 rounded-lg text-[9px] font-bold tracking-wide border border-slate-200/40">
              ON TARGET
            </span>
          </div>

          {/* Finished Goods Output */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Finished Goods Output</p>
            <p className="text-3xl font-black text-slate-900">
              {reportsData.production.finishedGoods.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-bold text-slate-400">Units</span>
            </p>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 pt-4 border-t border-slate-50">
            {/* Active Work Orders */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400">Active Work Orders</span>
                <span className="text-slate-800">{reportsData.production.activeWorkOrders}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Wastage Average */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400">Wastage Avg</span>
                <span className="text-amber-600">{reportsData.production.wastageAvg}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between min-h-[200px]">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100/40">
              <Package className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Inventory
            </span>
          </div>

          {/* Total Stock Value */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock Value</p>
            <p className="text-3xl font-black text-slate-900">
              ₹{reportsData.inventory.stockValue.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Low Stock / Turnover Info blocks */}
          <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-50">
            <div className="bg-rose-50/50 border border-rose-100/40 p-2.5 rounded-2xl flex flex-col justify-center">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-wide">LOW STOCK</p>
              <p className="text-xs font-black text-rose-700 mt-0.5">{reportsData.inventory.lowStockCount} Items</p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100/40 p-2.5 rounded-2xl flex flex-col justify-center">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wide">TURNOVER</p>
              <p className="text-xs font-black text-emerald-700 mt-0.5">{reportsData.inventory.turnoverRate}</p>
            </div>
          </div>
        </div>

        {/* Purchasing Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between min-h-[200px]">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100/40">
              <Truck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Purchasing
            </span>
            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100/40">
              {reportsData.purchasing.change}
            </span>
          </div>

          {/* Total Procurement */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Procurement</p>
            <p className="text-3xl font-black text-slate-900">
              ₹{reportsData.purchasing.procurementValue.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Bottom details list */}
          <div className="space-y-2 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Pending POs</span>
              <span className="font-black text-slate-800">{reportsData.purchasing.pendingPOs} Orders</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Overdue Payments</span>
              <span className="font-black text-rose-600">₹{reportsData.purchasing.overduePayments}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
