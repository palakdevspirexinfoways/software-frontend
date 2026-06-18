import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  RotateCw,
  CheckCircle2,
  Truck,
  Loader2,
  X,
  FileText,
  User,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Hash,
  Save,
  Edit2,
  PackageX,
  ChevronRight
} from 'lucide-react';

const paymentColors = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Partial: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Overdue: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Draft: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

export const SalesOrder = ({ onCreateInvoice, onViewDrafts }) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    client: '',
    product: '',
    payment: '',
    delivery: ''
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.get('/invoices');
      if (Array.isArray(data)) {
        setInvoices(data.map(inv => ({
          ...inv,
          id: inv.invoiceId, // JSX expects id
          issueDate: inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          total: inv.grandTotal,
          paid: inv.amountReceived || 0,
          pending: Math.max(0, inv.grandTotal - (inv.amountReceived || 0)) || null,
        })));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    // Search by text
    const searchLower = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !searchLower ||
      (inv.client && String(inv.client).toLowerCase().includes(searchLower)) ||
      (inv.id && String(inv.id).toLowerCase().includes(searchLower));

    // Advanced filters
    const filterClient = (filters.client || '').toLowerCase().trim();
    const matchesClient = !filterClient || (inv.client && String(inv.client).toLowerCase().includes(filterClient));

    const filterProd = (filters.product || '').toLowerCase().trim();
    const matchesProduct = !filterProd || (inv.items && inv.items.some(item =>
      (item.product || item.description || '').toLowerCase().includes(filterProd)
    ));

    const matchesPayment = !filters.payment || String(inv.payment).toLowerCase() === String(filters.payment).toLowerCase();

    const matchesDelivery = !filters.delivery || String(inv.delivery).toLowerCase() === String(filters.delivery).toLowerCase();

    const matchesAllFilters = matchesClient && matchesProduct && matchesPayment && matchesDelivery;

    if (activeTab === 'invoices') {
      return matchesSearch && matchesAllFilters && inv.payment !== 'Draft';
    }
    if (activeTab === 'drafts') {
      return matchesSearch && matchesAllFilters && inv.payment === 'Draft';
    }
    if (activeTab === 'quotations' || activeTab === 'returns') {
      return false; // Remain empty for mock screens
    }
    return matchesSearch && matchesAllFilters;
  });

  const fmt = (n) => n ? '₹' + n.toLocaleString('en-IN') : '—';

  const deliverySteps = ['Processing', 'Dispatched', 'Delivered', 'Cancelled'];

  const deliveryColors = {
    Delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    Dispatched: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    Processing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    Cancelled: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
  };

  const deliveryIcon = (status) => {
    if (status === 'Delivered') return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'Dispatched') return <Truck className="w-3 h-3" />;
    if (status === 'Processing') return <Loader2 className="w-3 h-3 animate-spin" />;
    if (status === 'Cancelled') return <PackageX className="w-3 h-3" />;
    return null;
  };

  // Cycle delivery status and save to backend immediately
  const handleCycleDelivery = async (inv) => {
    const currentIdx = deliverySteps.indexOf(inv.delivery);
    const nextStatus = deliverySteps[(currentIdx + 1) % deliverySteps.length];
    try {
      await api.put(`/invoices/${inv.id}`, { delivery: nextStatus });
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, delivery: nextStatus } : i));
    } catch (err) {
      console.error('Error updating delivery:', err);
    }
  };

  // Open edit modal pre-filled with invoice data
  const openEdit = (inv) => {
    setEditingInvoice(inv);
    setEditForm({
      delivery: inv.delivery || 'Processing',
      payment: inv.payment || 'Pending',
      paymentMethod: inv.paymentMethod || 'Cash',
      amountReceived: inv.amountReceived || 0,
      notes: inv.notes || '',
      dueDate: inv.dueDate && inv.dueDate !== '—' ? inv.dueDate : '',
    });
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;
    setSaving(true);
    try {
      const payload = {
        delivery: editForm.delivery,
        payment: editForm.payment,
        paymentMethod: editForm.paymentMethod,
        amountReceived: parseFloat(editForm.amountReceived) || 0,
        notes: editForm.notes,
      };
      await api.put(`/invoices/${editingInvoice.id}`, payload);
      // Update local state
      setInvoices(prev => prev.map(i => i.id === editingInvoice.id
        ? {
          ...i,
          delivery: payload.delivery,
          payment: payload.payment,
          paymentMethod: payload.paymentMethod,
          amountReceived: payload.amountReceived,
          paid: payload.amountReceived,
          pending: Math.max(0, i.total - payload.amountReceived) || null,
          notes: payload.notes,
        }
        : i
      ));
      setEditingInvoice(null);
    } catch (err) {
      console.error('Error updating invoice:', err);
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return alert('No records to export');

    const headers = ['Invoice ID', 'Client', 'Phone', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Pending', 'Payment Status', 'Delivery Status'];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      `"${inv.client || ''}"`,
      inv.phone || '',
      inv.issueDate || '',
      inv.dueDate || '',
      inv.total || 0,
      inv.paid || 0,
      inv.pending || 0,
      inv.payment || '',
      inv.delivery || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_orders_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildInvoiceHTML = (detail, autoPrint = true) => {
    const itemsList = detail.items || [];
    const itemRows = itemsList.map(item => `
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${item.product || item.description || ''}</td>
        <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${item.qty}</td>
        <td style="padding:12px 16px;text-align:right;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">&#x20B9;${(item.price || 0).toLocaleString('en-IN')}</td>
        <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #f3f4f6;">&#x20B9;${(item.total || (item.qty * (item.price || 0))).toLocaleString('en-IN')}</td>
      </tr>`).join('');
    const fIssue = detail.issueDate ? (typeof detail.issueDate === 'string' ? detail.issueDate : new Date(detail.issueDate).toLocaleDateString('en-IN')) : '—';
    const fDue = detail.dueDate ? (typeof detail.dueDate === 'string' ? detail.dueDate : new Date(detail.dueDate).toLocaleDateString('en-IN')) : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${detail.id || 'Invoice'}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:40px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #f3f4f6;}
    .brand{font-size:26px;font-weight:900;color:#059669;}.brand-sub{font-size:11px;color:#9ca3af;margin-top:3px;}
    .inv-meta{text-align:right;}.inv-id{font-size:20px;font-weight:800;color:#111;}.inv-date{font-size:11px;color:#9ca3af;margin-top:3px;}
    .badge{display:inline-block;margin-top:8px;padding:4px 14px;border-radius:99px;font-size:11px;font-weight:700;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;}
    .client-box{background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:28px;}
    .label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;}
    .client-name{font-size:16px;font-weight:800;color:#111;}.client-info{font-size:12px;color:#6b7280;margin-top:3px;}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;}
    thead tr{background:#f9fafb;}thead th{padding:10px 16px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;}
    .totals{border-top:2px solid #f3f4f6;padding-top:16px;}
    .total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#6b7280;}
    .grand{font-size:18px;font-weight:900;color:#059669;border-top:2px solid #e5e7eb;margin-top:10px;padding-top:12px;}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#d1d5db;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head>
    <body><div class="header"><div><div class="brand">GreenAdmin</div><div class="brand-sub">admin@green.com &nbsp;|&nbsp; +91 11 2345 6789</div></div>
    <div class="inv-meta"><div class="inv-id">${detail.id}</div><div class="inv-date">Issued: ${fIssue}${fDue ? '&nbsp;&nbsp;Due: ' + fDue : ''}</div>
    <span class="badge">${detail.payment || ''}</span></div></div>
    <div class="client-box"><div class="label">Bill To</div><div class="client-name">${detail.client || ''}</div>
    <div class="client-info">${detail.phone || ''}</div><div class="client-info">${detail.address || ''}</div></div>
    <table><thead><tr><th style="text-align:left;">Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Total</th></tr></thead>
    <tbody>${itemRows}</tbody></table>
    <div class="totals" style="max-width:320px;margin-left:auto;">
    <div class="total-row"><span>Subtotal</span><span style="color:#111;font-weight:600;">&#x20B9;${(detail.subtotal || 0).toLocaleString('en-IN')}</span></div>
    ${(detail.discount || 0) > 0 ? `<div class="total-row" style="color:#059669;"><span>Discount</span><span style="font-weight:600;">&#x2212; &#x20B9;${detail.discount.toLocaleString('en-IN')}</span></div>` : ''}
    ${(detail.tax || 0) > 0 ? `<div class="total-row"><span>GST</span><span style="color:#111;font-weight:600;">&#x20B9;${detail.tax.toLocaleString('en-IN')}</span></div>` : ''}
    <div class="total-row grand"><span>Grand Total</span><span>&#x20B9;${(detail.grandTotal || 0).toLocaleString('en-IN')}</span></div></div>
    <div class="footer">Thank you for your business! &#8212; GreenAdmin</div>
    ${autoPrint ? '<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>' : ''}
    </body></html>`;
  };


  const handlePrintPDF = (inv) => {
    const detail = inv.items ? inv : invoices.find(i => i.id === inv.id);
    if (!detail) return;
    const html = buildInvoiceHTML(detail);
    const win = window.open('', '_blank', 'width=820,height=950');
    if (win) { win.document.write(html); win.document.close(); }
  };

  // Download button: save as .html file to PC
  const handleDownloadFile = (inv) => {
    const detail = inv.items ? inv : invoices.find(i => i.id === inv.id);
    if (!detail) return;
    const html = buildInvoiceHTML(detail, false); // no auto-print script
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.id || 'invoice'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Order Records</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage invoices, billing & delivery status</p>
        </div>
        <div className="flex items-center gap-2.5">
          {onViewDrafts && (
            <button
              onClick={onViewDrafts}
              className="flex items-center gap-2 px-4 py-2.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Saved Drafts
            </button>
          )}
          <button
            onClick={onCreateInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice ID or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${showFilters || Object.values(filters).some(v => v) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {Object.values(filters).filter(v => v).length > 0 && `(${Object.values(filters).filter(v => v).length})`}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-4 gap-4 animate-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Name</label>
              <input
                type="text"
                placeholder="Filter by client..."
                value={filters.client}
                onChange={e => setFilters(f => ({ ...f, client: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
              <input
                type="text"
                placeholder="Filter by product..."
                value={filters.product}
                onChange={e => setFilters(f => ({ ...f, product: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
              <select
                value={filters.payment}
                onChange={e => setFilters(f => ({ ...f, payment: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Status</label>
              <select
                value={filters.delivery}
                onChange={e => setFilters(f => ({ ...f, delivery: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Processing">Processing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            {(filters.client || filters.product || filters.payment || filters.delivery) && (
              <div className="col-span-4 flex justify-end mt-1">
                <button
                  onClick={() => setFilters({ client: '', product: '', payment: '', delivery: '' })}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/60 p-1 rounded-xl w-fit">
        {[
          { id: 'invoices', label: 'Invoices' },
          { id: 'drafts', label: 'Drafts' },
          { id: 'quotations', label: 'Quotations' },
          { id: 'returns', label: 'Returns' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Invoice ID</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Issued</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Due</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Total</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Paid</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Pending</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Payment</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Delivery</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{inv.id}</span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="font-bold text-slate-800 text-xs">{inv.client}</span>
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-medium whitespace-nowrap">{inv.issueDate}</td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className={`font-semibold text-xs ${inv.payment === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      {inv.dueDate}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-extrabold text-slate-900 whitespace-nowrap">{fmt(inv.total)}</td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className={`font-bold ${inv.paid ? 'text-emerald-600' : 'text-slate-300'}`}>{fmt(inv.paid)}</span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className={`font-bold ${inv.pending ? 'text-rose-500' : 'text-slate-300'}`}>{fmt(inv.pending)}</span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${paymentColors[inv.payment]}`}>
                      {inv.payment}
                    </span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <button
                      onClick={() => handleCycleDelivery(inv)}
                      title="Click to advance delivery status"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:opacity-80 hover:scale-105 ${deliveryColors[inv.delivery] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {deliveryIcon(inv.delivery)}
                      {inv.delivery}
                      <ChevronRight className="w-2.5 h-2.5 opacity-50" />
                    </button>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePrintPDF(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                        title="Print Bill"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                        title="Download to PC"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                        title="Edit Invoice"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Bill Popup Modal (Rendered via portal to prevent stacking context bugs) ===== */}
      {selectedInvoice && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col" style={{ maxHeight: 'min(90vh,780px)', overflow: 'hidden' }}>

            {/* ---- Modal Header ---- */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Invoice Bill</p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wide">{selectedInvoice.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ---- Modal Body ---- */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">

              {/* Company + Status Row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none">GreenAdmin</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">admin@green.com &nbsp;·&nbsp; +91 11 2345 6789</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold ${paymentColors[selectedInvoice.payment]}`}>
                    {selectedInvoice.payment}
                  </span>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[11px] text-slate-400 font-medium">Issued: <span className="text-slate-600 font-semibold">{selectedInvoice.issueDate}</span></p>
                    {selectedInvoice.dueDate && (
                      <p className="text-[11px] text-rose-400 font-semibold">Due: {selectedInvoice.dueDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                      {selectedInvoice.client.charAt(0)}
                    </div>
                    <p className="text-sm font-extrabold text-slate-800">{selectedInvoice.client}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span>{selectedInvoice.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <span>{selectedInvoice.address}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="py-3 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">Qty</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items && selectedInvoice.items.map((item, i) => (
                      <tr key={i} className={`${i < selectedInvoice.items.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/50 transition-colors`}>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold leading-snug">{item.description || item.product}</td>
                        <td className="py-3.5 px-4 text-center text-slate-500">{item.qty}</td>
                        <td className="py-3.5 px-4 text-right text-slate-500">₹{(item.price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-800">₹{(item.total || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-700">₹{(selectedInvoice.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {(selectedInvoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>Discount / Advance</span>
                      <span className="font-semibold">− ₹{selectedInvoice.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(selectedInvoice.tax || 0) > 0 && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>GST</span>
                      <span className="font-semibold text-slate-700">₹{selectedInvoice.tax.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-3 mt-1 border-t-2 border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Grand Total</span>
                    <span className="text-xl font-black text-emerald-600">₹{(selectedInvoice.grandTotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Modal Footer ---- */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium italic">Thank you for your business!</p>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintPDF(selectedInvoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ===== Edit Invoice Modal ===== */}
      {editingInvoice && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Edit Invoice</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{editingInvoice.id} · {editingInvoice.client}</p>
                </div>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: '65vh' }}>

              {/* Delivery Status */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Processing', 'Dispatched', 'Delivered', 'Cancelled'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, delivery: status }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editForm.delivery === status
                          ? deliveryColors[status] + ' shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                        }`}
                    >
                      {deliveryIcon(status)}
                      {status}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Select the current delivery stage for this order.</p>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
                <select
                  value={editForm.payment}
                  onChange={e => setEditForm(f => ({ ...f, payment: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Amount Received */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Received (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.amountReceived}
                  onChange={e => setEditForm(f => ({ ...f, amountReceived: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-400 text-right"
                />
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-slate-400">Grand Total: <span className="text-slate-600">{fmt(editingInvoice.total)}</span></span>
                  <span className="text-rose-500">Pending: {fmt(Math.max(0, (editingInvoice.total || 0) - parseFloat(editForm.amountReceived || 0)))}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notes / Remarks</label>
                <textarea
                  rows="2"
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
              <button onClick={() => setEditingInvoice(null)} className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleUpdateInvoice}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SalesOrder;


