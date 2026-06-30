import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Edit2, Trash2, FileText, CreditCard, Download, Phone,
  Mail, MapPin, Building2, Hash, Calendar, Star, Tag, Clock,
  TrendingUp, DollarSign, ShoppingBag, AlertCircle, CheckCircle,
  Package, ChevronDown, ChevronRight, Search, X, RefreshCw,
  MessageCircle, Send, User, Printer, BookOpen, Crown, Zap
} from 'lucide-react';
import * as crmService from '../services/crmService';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../components/Toast';

const fmt = (n) => n ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const LABEL_STYLES = {
  'VIP':         { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  'Premium':     { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-400' },
  'Regular':     { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400'   },
  'Distributor': { bg: 'bg-teal-100',   text: 'text-teal-800',   dot: 'bg-teal-400'   },
  'Favorite':    { bg: 'bg-rose-100',   text: 'text-rose-800',   dot: 'bg-rose-400'   },
};
const ALL_LABELS = Object.keys(LABEL_STYLES);

const PAYMENT_COLORS = {
  Paid:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Partial: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Overdue: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Draft:   'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

const TIMELINE_ICONS = {
  customer_created: { icon: User, color: 'bg-emerald-100 text-emerald-600' },
  customer_updated: { icon: Edit2, color: 'bg-blue-100 text-blue-600' },
  invoice_created:  { icon: FileText, color: 'bg-purple-100 text-purple-600' },
  payment_received: { icon: CreditCard, color: 'bg-teal-100 text-teal-600' },
};

// ─── Tab: Overview ────────────────────────────────────────────
const OverviewTab = ({ customer, stats, onEdit, onCreateInvoice, onDelete }) => {
  const fields = [
    { icon: Phone,    label: 'Mobile', value: customer.mobile },
    { icon: Phone,    label: 'Alt Mobile', value: customer.altMobile },
    { icon: Mail,     label: 'Email', value: customer.email },
    { icon: Hash,     label: 'GST', value: customer.gst, mono: true },
    { icon: Hash,     label: 'PAN', value: customer.pan, mono: true },
    { icon: Building2,label: 'Company', value: customer.company },
    { icon: MapPin,   label: 'Address', value: customer.address },
    { icon: MapPin,   label: 'City', value: customer.city },
    { icon: MapPin,   label: 'State', value: customer.state },
    { icon: MapPin,   label: 'Pincode', value: customer.pincode },
    { icon: Calendar, label: 'Member Since', value: fmtDate(customer.createdAt) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer Info Card */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Information</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm leading-tight">{customer.name}</p>
                  {customer.company && <p className="text-xs text-slate-500 font-medium">{customer.company}</p>}
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{customer.code}</span>
                </div>
              </div>
              {/* Labels */}
              {customer.labels?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customer.labels.map(l => {
                    const s = LABEL_STYLES[l] || {};
                    return <span key={l} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{l}
                    </span>;
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-50 pt-4">
            {fields.filter(f => f.value).map(f => (
              <div key={f.label} className="flex items-start gap-2.5">
                <f.icon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
                  <p className={`text-xs font-semibold text-slate-700 leading-tight ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="space-y-2">
            {[
              { icon: FileText, label: 'Create Invoice', action: onCreateInvoice, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
              { icon: Edit2,    label: 'Edit Customer',  action: onEdit,          color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { icon: Download, label: 'Download Ledger',action: () => {},        color: 'text-slate-600 bg-slate-50 hover:bg-slate-100' },
              { icon: Trash2,   label: 'Delete Customer',action: onDelete,        color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
            ].map(a => (
              <button key={a.label} onClick={a.action}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${a.color}`}>
                <a.icon className="w-3.5 h-3.5" />{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats + Notes */}
      <div className="lg:col-span-2 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Bills',    value: stats?.totalBills || 0,           icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Total Purchase', value: fmt(stats?.totalPurchase),        icon: TrendingUp,  color: 'text-blue-600 bg-blue-50' },
            { label: 'Amount Paid',    value: fmt(stats?.totalPaid),            icon: CheckCircle, color: 'text-teal-600 bg-teal-50' },
            { label: 'Outstanding',    value: fmt(stats?.outstanding),          icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
            { label: 'Avg Order',      value: fmt(stats?.avgOrderValue),        icon: DollarSign,  color: 'text-purple-600 bg-purple-50' },
            { label: 'Last Purchase',  value: fmtDate(stats?.lastPurchaseDate), icon: Calendar,    color: 'text-amber-600 bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-extrabold text-slate-800 leading-tight truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Internal Notes
            </p>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">{customer.notes}</p>
          </div>
        )}

        {/* Type + Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Type</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">{customer.type}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {customer.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />} {customer.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Billing History ─────────────────────────────────────
const BillingTab = ({ stats, onPrintInvoice }) => {
  const invoices = stats?.invoices || [];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {invoices.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No invoices found</p>
          <p className="text-xs text-slate-300 mt-1">Invoices will appear here after billing</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Invoice #', 'Date', 'Payment Status', 'Total', 'Paid', 'Balance', 'Actions'].map(h => (
                  <th key={h} className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map(inv => {
                const grandTotal = inv.grandTotal || 0;
                const paid = inv.amountReceived || 0;
                const balance = Math.max(0, grandTotal - paid);
                let status = inv.payment || 'Pending';
                if (status !== 'Draft') {
                  if (balance < 0.01 && grandTotal > 0) status = 'Paid';
                  else if (paid > 0 && balance >= 0.01) status = 'Partial';
                  else if (paid === 0) status = 'Pending';
                }
                return (
                  <tr key={inv.invoiceId || inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{inv.invoiceId}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium whitespace-nowrap">{fmtDate(inv.issueDate)}</td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${PAYMENT_COLORS[status]}`}>{status}</span>
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-900 whitespace-nowrap">{fmt(grandTotal)}</td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`font-bold ${paid > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{fmt(paid)}</span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`font-bold ${balance > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{fmt(balance)}</span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <button onClick={() => onPrintInvoice?.(inv)} title="Print / View"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Product History ─────────────────────────────────────
const ProductHistoryTab = ({ customerId, allInvoices, customer }) => {
  const pricing = [];
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = pricing.filter(p =>
    !search || p.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const getProductInvoices = (productName) => {
    return (allInvoices || [])
      .filter(inv => inv.phone === customer?.mobile && (inv.items || []).some(item => item.product === productName))
      .map(inv => {
        const item = (inv.items || []).find(i => i.product === productName);
        return { invoiceId: inv.invoiceId, date: inv.issueDate, qty: item?.qty || 0, price: item?.price || 0, disc: item?.disc || 0, tax: item?.tax || 0, total: item?.total || (item?.qty || 0) * (item?.price || 0) };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No product history yet</p>
          <p className="text-xs text-slate-300 mt-1">Product pricing will be tracked after first purchase</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Product', 'Last Price', 'Avg Price', 'High', 'Low', 'Total Qty', 'Orders', 'Last Purchase'].map(h => (
                  <th key={h} className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === p.productName ? null : p.productName)}>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="font-bold text-slate-800">{p.productName}</span>
                        {expanded === p.productName ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-emerald-600 whitespace-nowrap">{fmt(p.lastPrice)}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-700 whitespace-nowrap">{fmt(p.averagePrice)}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium whitespace-nowrap">{fmt(p.highestPrice)}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium whitespace-nowrap">{fmt(p.lowestPrice)}</td>
                    <td className="py-3.5 px-5 text-center font-bold text-slate-800 whitespace-nowrap">{p.totalQuantity}</td>
                    <td className="py-3.5 px-5 text-center font-bold text-slate-800 whitespace-nowrap">{p.totalOrders}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium whitespace-nowrap">{fmtDate(p.lastPurchaseDate)}</td>
                  </tr>
                  {expanded === p.productName && (
                    <tr>
                      <td colSpan={8} className="bg-slate-50/50 px-5 pb-4 pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Complete Purchase History for {p.productName}</p>
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-slate-400 font-bold">
                              <th className="text-left pb-2">Invoice #</th>
                              <th className="text-left pb-2">Date</th>
                              <th className="text-center pb-2">Qty</th>
                              <th className="text-right pb-2">Rate</th>
                              <th className="text-right pb-2">Disc %</th>
                              <th className="text-right pb-2">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {getProductInvoices(p.productName).map((inv, i) => (
                              <tr key={i}>
                                <td className="py-1.5 font-mono font-bold text-slate-600">{inv.invoiceId}</td>
                                <td className="py-1.5 text-slate-500">{fmtDate(inv.date)}</td>
                                <td className="py-1.5 text-center text-slate-700 font-semibold">{inv.qty}</td>
                                <td className="py-1.5 text-right text-emerald-600 font-bold">{fmt(inv.price)}</td>
                                <td className="py-1.5 text-right text-slate-500">{inv.disc || 0}%</td>
                                <td className="py-1.5 text-right font-extrabold text-slate-800">{fmt(inv.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Timeline ────────────────────────────────────────────
const TimelineTab = ({ customerId }) => {
  const events = [];

  const typeConfig = (type) => {
    return TIMELINE_ICONS[type] || { icon: Clock, color: 'bg-slate-100 text-slate-500' };
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No activity yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Activity Timeline</p>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-5">
              {events.map(evt => {
                const config = typeConfig(evt.type);
                const Icon = config.icon;
                return (
                  <div key={evt.id} className="flex gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 pt-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{evt.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{fmtDateTime(evt.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Payment History Tab ──────────────────────────────────────
const PaymentHistoryTab = ({ stats }) => {
  const payments = useMemo(() => {
    const list = [];
    (stats?.invoices || []).forEach(inv => {
      if ((inv.amountReceived || 0) > 0) {
        list.push({
          date: inv.issueDate,
          invoiceId: inv.invoiceId,
          mode: inv.paymentMethod || 'Cash',
          amount: inv.amountReceived || 0,
          remaining: Math.max(0, (inv.grandTotal || 0) - (inv.amountReceived || 0)),
        });
      }
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {payments.length === 0 ? (
        <div className="py-16 text-center">
          <CreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No payments recorded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Date', 'Invoice #', 'Payment Mode', 'Amount Received', 'Remaining Balance'].map(h => (
                  <th key={h} className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-slate-500 font-medium whitespace-nowrap">{fmtDate(p.date)}</td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{p.invoiceId}</span>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600"><CreditCard className="w-2.5 h-2.5" />{p.mode}</span>
                  </td>
                  <td className="py-3.5 px-5 font-extrabold text-emerald-600 whitespace-nowrap">{fmt(p.amount)}</td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className={`font-bold ${p.remaining > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{fmt(p.remaining)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main Customer Profile ────────────────────────────────────
export const CustomerProfile = ({ customerId, onBack, onCreateInvoice }) => {
  const { customers, allInvoices, refreshCustomers, getCustomerStats } = useCRM();
  const { showToast, ToastContainer } = useToast();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const c = customers.find(cust => cust._id === customerId || cust.id === customerId);
    setCustomer(c);
    if (c) {
      setStats(getCustomerStats(c));
      setEditForm(c);
    }
  }, [customerId, allInvoices, customers, getCustomerStats]);

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm font-bold text-slate-400">Loading customer...</p>
        </div>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    if (!editForm.name?.trim() || !editForm.mobile?.trim()) {
      showToast('Name and mobile are required', 'error');
      return;
    }
    try {
      const saved = await crmService.saveCustomer({ ...editForm, _id: customer._id || customer.id });
      setCustomer(saved);
      await refreshCustomers();
      setEditMode(false);
      showToast('Customer updated!', 'success');
    } catch(e) {
      showToast('Error updating customer', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await crmService.deleteCustomer(customer._id || customer.id);
      await refreshCustomers();
      showToast('Customer deleted', 'info');
      onBack?.();
    } catch(e) {
      showToast('Error deleting customer', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'billing', label: `Billing (${stats?.totalBills || 0})` },
    { id: 'payments', label: 'Payments' },
    { id: 'products', label: 'Product History' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <ToastContainer />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{customer.name}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{customer.code} · {customer.type} Customer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${editMode ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}>
            <Edit2 className="w-3.5 h-3.5" />{editMode ? 'Cancel Edit' : 'Edit'}
          </button>
          <button onClick={() => onCreateInvoice?.(customer)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-emerald-500/20">
            <FileText className="w-3.5 h-3.5" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/60 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-700">Edit mode — make changes and save</p>
          </div>
          <button onClick={handleSaveEdit}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all">
            <CheckCircle className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          customer={editMode ? { ...customer, ...editForm } : customer}
          stats={stats}
          onEdit={() => setEditMode(true)}
          onCreateInvoice={() => onCreateInvoice?.(customer)}
          onDelete={handleDelete}
        />
      )}
      {activeTab === 'billing' && <BillingTab stats={stats} />}
      {activeTab === 'payments' && <PaymentHistoryTab stats={stats} />}
      {activeTab === 'products' && <ProductHistoryTab customerId={customerId} allInvoices={allInvoices} customer={customer} />}
      {activeTab === 'timeline' && <TimelineTab customerId={customerId} />}
    </div>
  );
};

export default CustomerProfile;
