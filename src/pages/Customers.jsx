import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Filter, Plus, Download, Users, TrendingUp, AlertCircle,
  ChevronUp, ChevronDown, Eye, FileText, Edit2, Trash2, X,
  Star, Crown, Package, Zap, Phone, Mail, Building2, Hash,
  CheckCircle, XCircle, ChevronLeft, ChevronRight as ChevronRightIcon,
  MoreHorizontal, RefreshCw, Tag
} from 'lucide-react';
import * as crmService from '../services/crmService';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../components/Toast';

// ─── Label config ─────────────────────────────────────────────
const LABEL_STYLES = {
  'VIP':        { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  'Premium':    { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-400' },
  'Regular':    { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400'   },
  'Distributor':{ bg: 'bg-teal-100',   text: 'text-teal-800',   dot: 'bg-teal-400'   },
  'Favorite':   { bg: 'bg-rose-100',   text: 'text-rose-800',   dot: 'bg-rose-400'   },
};
const ALL_LABELS = Object.keys(LABEL_STYLES);

const TYPE_COLORS = {
  Retail:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Wholesale:   'bg-blue-50 text-blue-700 ring-blue-200',
  Distributor: 'bg-purple-50 text-purple-700 ring-purple-200',
  Corporate:   'bg-amber-50 text-amber-700 ring-amber-200',
};

const STATUS_COLORS = {
  Active:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inactive: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const fmt = (n) => n ? '₹' + Number(n).toLocaleString('en-IN') : '₹0';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Validation Rules ─────────────────────────────────────────
const validateField = (field, value, form = {}) => {
  const v = value?.toString().trim() ?? '';
  switch (field) {
    case 'name':
      if (!v) return 'Customer name is required';
      if (v.length < 2) return 'Name must be at least 2 characters';
      if (v.length > 100) return 'Name must be under 100 characters';
      if (!/^[a-zA-Z\s.\-']+$/.test(v)) return 'Only letters, spaces, dots and hyphens allowed';
      return '';
    case 'company':
      if (v.length > 100) return 'Company name too long (max 100 chars)';
      return '';
    case 'mobile':
      if (!v) return 'Mobile number is required';
      if (!/^[6-9]\d{9}$/.test(v)) return 'Must be 10 digits starting with 6, 7, 8 or 9';
      return '';
    case 'altMobile':
      if (!v) return '';
      if (!/^[6-9]\d{9}$/.test(v)) return 'Must be 10 digits starting with 6, 7, 8 or 9';
      if (v === form.mobile?.trim()) return 'Alt mobile must differ from primary mobile';
      return '';
    case 'email':
      if (!v) return '';
      if (v.length > 100) return 'Email too long (max 100 chars)';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address';
      return '';
    case 'gst':
      if (!v) return '';
      if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(v.toUpperCase()))
        return 'Format: 24ABCDE1234F1Z5 (15 chars)';
      return '';
    case 'pan':
      if (!v) return '';
      if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(v.toUpperCase()))
        return 'Format: ABCDE1234F (5 letters + 4 digits + 1 letter)';
      return '';
    case 'pincode':
      if (!v) return '';
      if (!/^\d{6}$/.test(v)) return 'Pincode must be exactly 6 digits';
      return '';
    case 'address':
      if (v.length > 200) return 'Address too long (max 200 chars)';
      return '';
    case 'city':
      if (v.length > 50) return 'City too long (max 50 chars)';
      if (v && !/^[a-zA-Z\s\-]+$/.test(v)) return 'City should only contain letters';
      return '';
    case 'state':
      if (v.length > 50) return 'State too long (max 50 chars)';
      if (v && !/^[a-zA-Z\s\-]+$/.test(v)) return 'State should only contain letters';
      return '';
    case 'notes':
      if (v.length > 500) return `Too long (${v.length}/500 chars)`;
      return '';
    default:
      return '';
  }
};

// ─── Field Wrapper Component ────────────────────────────────────
const FormField = ({ label, required, children, err, hint, lc }) => (
  <div>
    <label className={lc}>{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
    {children}
    {err ? (
      <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
        <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />{err}
      </p>
    ) : hint ? (
      <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
    ) : null}
  </div>
);

// ─── Add / Edit Customer Modal ────────────────────────────────
const CustomerModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: '', company: '', mobile: '', altMobile: '', email: '',
    gst: '', pan: '', address: '', city: '', state: '', pincode: '',
    type: 'Retail', status: 'Active', labels: [], notes: '',
    ...(initial || {}),
  });
  const [touched, setTouched] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setTouched(t => ({ ...t, [k]: true }));
  };

  const touch = (k) => setTouched(t => ({ ...t, [k]: true }));

  const toggleLabel = (label) => {
    setForm(f => ({
      ...f,
      labels: f.labels.includes(label) ? f.labels.filter(l => l !== label) : [...f.labels, label],
    }));
  };

  // Get error for a field (only show if touched or submitAttempted)
  const err = (field) => touched[field] ? validateField(field, form[field], form) : '';

  // Count total errors
  const hasErrors = () => {
    const fields = ['name','mobile','altMobile','email','gst','pan','pincode','address','city','state','company','notes'];
    return fields.some(f => validateField(f, form[f], form) !== '');
  };

  const handleSave = async () => {
    // Touch all fields to show errors
    const allFields = ['name','mobile','altMobile','email','gst','pan','pincode','address','city','state','company','notes'];
    const allTouched = {};
    allFields.forEach(f => { allTouched[f] = true; });
    setTouched(allTouched);

    if (hasErrors()) { setGlobalError('Please fix the errors above before saving.'); return; }

    setSaving(true);
    setGlobalError('');
    try {
      const dup = await crmService.checkDuplicate(form.mobile, form.email, form.gst, form._id || form.id);
      if (dup) {
        setGlobalError(`${dup.field} already exists for customer: ${dup.customer.name} (${dup.customer.code})`);
        setSaving(false);
        return;
      }

      const saved = await crmService.saveCustomer(form);
      setSaving(false);
      onSave(saved);
    } catch (error) {
      console.error(error);
      setGlobalError(error.message || 'Failed to save customer');
      setSaving(false);
    }
  };

  // Styling helpers
  const inputBase = 'w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 transition-all';
  const inputOk   = 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500';
  const inputErr  = 'border-rose-300 bg-rose-50/30 focus:ring-rose-400/20 focus:border-rose-400';
  const ic = (field) => `${inputBase} ${err(field) ? inputErr : inputOk}`;
  const lc = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block';

  const modal = (
    <div
      className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card — fixed height, internal scroll */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>

        {/* ── Fixed Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-3xl bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">{initial?.id ? 'Edit Customer' : 'Add New Customer'}</p>
              {initial?.code && <p className="text-[10px] text-slate-400 font-medium">{initial.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Global error */}
          {globalError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{globalError}
            </div>
          )}

          {/* Name + Company */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required err={err('name')} lc={lc}>
              <input
                className={ic('name')}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onBlur={() => touch('name')}
                placeholder="Rahul Shah"
                maxLength={101}
              />
              <div className="flex justify-end mt-0.5">
                <span className={`text-[9px] font-medium ${form.name.length > 95 ? 'text-rose-400' : 'text-slate-300'}`}>{form.name.length}/100</span>
              </div>
            </FormField>
            <FormField label="Company Name" err={err('company')} lc={lc}>
              <input
                className={ic('company')}
                value={form.company}
                onChange={e => set('company', e.target.value)}
                onBlur={() => touch('company')}
                placeholder="Shah Traders"
                maxLength={101}
              />
            </FormField>
          </div>

          {/* Mobile + Alt Mobile */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mobile" required hint="Indian 10-digit number (6-9 start)" err={err('mobile')} lc={lc}>
              <input
                className={ic('mobile')}
                value={form.mobile}
                onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => touch('mobile')}
                placeholder="9876543210"
                maxLength={10}
                type="tel"
              />
            </FormField>
            <FormField label="Alternate Mobile" hint="Optional, must differ from primary" err={err('altMobile')} lc={lc}>
              <input
                className={ic('altMobile')}
                value={form.altMobile}
                onChange={e => set('altMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => touch('altMobile')}
                placeholder="Optional"
                maxLength={10}
                type="tel"
              />
            </FormField>
          </div>

          {/* Email + GST */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email Address" err={err('email')} lc={lc}>
              <input
                className={ic('email')}
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                onBlur={() => touch('email')}
                placeholder="rahul@company.com"
                maxLength={101}
              />
            </FormField>
            <FormField label="GST Number" hint="Format: 24ABCDE1234F1Z5" err={err('gst')} lc={lc}>
              <input
                className={ic('gst')}
                value={form.gst}
                onChange={e => set('gst', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15))}
                onBlur={() => touch('gst')}
                placeholder="24ABCDE1234F1Z5"
                maxLength={15}
              />
              <span className={`text-[9px] font-medium ${form.gst.length > 0 && form.gst.length < 15 ? 'text-amber-500' : 'text-slate-300'}`}>{form.gst.length}/15</span>
            </FormField>
          </div>

          {/* PAN + Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="PAN Number" hint="Format: ABCDE1234F" err={err('pan')} lc={lc}>
              <input
                className={ic('pan')}
                value={form.pan}
                onChange={e => set('pan', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10))}
                onBlur={() => touch('pan')}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              <span className={`text-[9px] font-medium ${form.pan.length > 0 && form.pan.length < 10 ? 'text-amber-500' : 'text-slate-300'}`}>{form.pan.length}/10</span>
            </FormField>
            <FormField label="Pincode" hint="6-digit area pincode" err={err('pincode')} lc={lc}>
              <input
                className={ic('pincode')}
                value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => touch('pincode')}
                placeholder="380001"
                maxLength={6}
              />
            </FormField>
          </div>

          {/* Address */}
          <FormField label="Billing Address" err={err('address')} lc={lc}>
            <textarea
              rows={2}
              className={ic('address')}
              value={form.address}
              onChange={e => set('address', e.target.value)}
              onBlur={() => touch('address')}
              placeholder="Street address, building, landmark..."
              maxLength={201}
            />
            <div className="flex justify-end mt-0.5">
              <span className={`text-[9px] font-medium ${form.address.length > 180 ? 'text-rose-400' : 'text-slate-300'}`}>{form.address.length}/200</span>
            </div>
          </FormField>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City" err={err('city')} lc={lc}>
              <input
                className={ic('city')}
                value={form.city}
                onChange={e => set('city', e.target.value)}
                onBlur={() => touch('city')}
                placeholder="Ahmedabad"
                maxLength={51}
              />
            </FormField>
            <FormField label="State" err={err('state')} lc={lc}>
              <input
                className={ic('state')}
                value={form.state}
                onChange={e => set('state', e.target.value)}
                onBlur={() => touch('state')}
                placeholder="Gujarat"
                maxLength={51}
              />
            </FormField>
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Customer Type</label>
              <select className={`${ic('type')} cursor-pointer`} value={form.type} onChange={e => set('type', e.target.value)}>
                {['Retail', 'Wholesale', 'Distributor', 'Corporate'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Status</label>
              <select className={`${ic('status')} cursor-pointer`} value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className={lc}>Customer Labels</label>
            <div className="flex flex-wrap gap-2">
              {ALL_LABELS.map(label => {
                const s = LABEL_STYLES[label];
                const active = form.labels.includes(label);
                return (
                  <button key={label} type="button" onClick={() => toggleLabel(label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all cursor-pointer ${active ? `${s.bg} ${s.text} border-transparent` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? s.dot : 'bg-slate-300'}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <FormField label="Internal Notes" err={err('notes')} lc={lc}>
            <textarea
              rows={2}
              className={ic('notes')}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              onBlur={() => touch('notes')}
              placeholder="Internal staff notes (max 500 chars)..."
              maxLength={501}
            />
            <div className="flex justify-end mt-0.5">
              <span className={`text-[9px] font-medium ${form.notes.length > 450 ? 'text-rose-400' : 'text-slate-300'}`}>{form.notes.length}/500</span>
            </div>
          </FormField>
        </div>

        {/* ── Fixed Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {initial?.id ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

// ─── Main Customers Page ──────────────────────────────────────
export const Customers = ({ onViewProfile, onCreateInvoice }) => {
  const { customers, allInvoices, refreshCustomers } = useCRM();
  const { showToast, ToastContainer } = useToast();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: '', status: '', city: '', state: '' });
  const [sort, setSort] = useState({ col: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const PAGE_SIZE = 20;

  const searchRef = useRef(null);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Compute stats per customer from invoices
  const customerStats = useMemo(() => {
    const map = {};
    customers.forEach(c => {
      const invs = allInvoices.filter(i => i.phone === c.mobile && i.payment !== 'Draft');
      const totalPurchase = invs.reduce((s, i) => s + (i.grandTotal || 0), 0);
      const totalPaid = invs.reduce((s, i) => s + (i.amountReceived || 0), 0);
      const sorted = [...invs].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
      map[c.id] = {
        totalBills: invs.length,
        totalPurchase,
        outstanding: Math.max(0, totalPurchase - totalPaid),
        totalPaid,
        lastPurchase: sorted[0]?.issueDate || null,
      };
    });
    return map;
  }, [customers, allInvoices]);

  // Overview stats
  const overview = useMemo(() => {
    const active = customers.filter(c => c.status === 'Active').length;
    const now = new Date(); const month = now.getMonth(); const year = now.getFullYear();
    const newThisMonth = customers.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
    const totalOutstanding = Object.values(customerStats).reduce((s, v) => s + (v.outstanding || 0), 0);
    const repeat = customers.filter(c => (customerStats[c.id]?.totalBills || 0) > 1).length;
    return { total: customers.length, active, newThisMonth, totalOutstanding, repeat };
  }, [customers, customerStats]);

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let list = customers.filter(c => {
      const q = search.toLowerCase();
      if (q && !(
        c.name?.toLowerCase().includes(q) ||
        c.mobile?.includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.gst?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )) return false;
      if (filters.type && c.type !== filters.type) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.city && !c.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.state && !c.state?.toLowerCase().includes(filters.state.toLowerCase())) return false;
      return true;
    });

    list.sort((a, b) => {
      let va, vb;
      switch (sort.col) {
        case 'name':         va = a.name; vb = b.name; break;
        case 'createdAt':    va = new Date(a.createdAt); vb = new Date(b.createdAt); break;
        case 'totalPurchase':va = customerStats[a.id]?.totalPurchase || 0; vb = customerStats[b.id]?.totalPurchase || 0; break;
        case 'outstanding':  va = customerStats[a.id]?.outstanding || 0; vb = customerStats[b.id]?.outstanding || 0; break;
        case 'lastPurchase': va = new Date(customerStats[a.id]?.lastPurchase || 0); vb = new Date(customerStats[b.id]?.lastPurchase || 0); break;
        case 'totalBills':   va = customerStats[a.id]?.totalBills || 0; vb = customerStats[b.id]?.totalBills || 0; break;
        default: va = a.name; vb = b.name;
      }
      if (typeof va === 'string') return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [customers, search, filters, sort, customerStats]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSort = (col) => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <ChevronUp className="w-3 h-3 text-slate-300" />;
    return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />;
  };

  const handleSaveCustomer = (saved) => {
    refreshCustomers();
    setShowModal(false);
    setEditCustomer(null);
    showToast(saved.id ? 'Customer updated!' : 'Customer added!', 'success');
  };

  const handleDelete = async (c) => {
    try {
      await crmService.deleteCustomer(c._id || c.id);
      await refreshCustomers();
      setDeleteConfirm(null);
      showToast('Customer deleted', 'info');
    } catch (e) {
      showToast('Failed to delete customer', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['Code', 'Name', 'Company', 'Mobile', 'Email', 'GST', 'Type', 'City', 'State', 'Status', 'Total Bills', 'Total Purchase', 'Outstanding', 'Created'];
    const rows = filtered.map(c => {
      const s = customerStats[c.id] || {};
      return [c.code, `"${c.name}"`, `"${c.company}"`, c.mobile, c.email, c.gst, c.type, c.city, c.state, c.status, s.totalBills || 0, s.totalPurchase || 0, s.outstanding || 0, fmtDate(c.createdAt)];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `customers_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Exported successfully!', 'success');
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {overview.total} customers · {overview.active} active · <span className="text-emerald-600 font-bold">{overview.newThisMonth} new this month</span>
            <span className="ml-2 text-slate-300">·</span>
            <span className="ml-2 text-xs font-bold text-slate-500">Ctrl+K to search</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => { setEditCustomer(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-all">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: overview.total, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active', value: overview.active, icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
          { label: 'Repeat Customers', value: overview.repeat, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total Outstanding', value: fmt(overview.totalOutstanding), icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, mobile, company, GST, code, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${(showFilters || activeFilters) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5" />
            Filters {activeFilters > 0 && `(${activeFilters})`}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Customer Type', key: 'type', opts: ['', 'Retail', 'Wholesale', 'Distributor', 'Corporate'] },
              { label: 'Status', key: 'status', opts: ['', 'Active', 'Inactive'] },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
                <select value={filters[f.key]} onChange={e => { setFilters(fi => ({ ...fi, [f.key]: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer">
                  {f.opts.map(o => <option key={o} value={o}>{o || `All ${f.label}s`}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">City</label>
              <input value={filters.city} onChange={e => { setFilters(fi => ({ ...fi, city: e.target.value })); setPage(1); }}
                placeholder="Filter by city..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State</label>
              <input value={filters.state} onChange={e => { setFilters(fi => ({ ...fi, state: e.target.value })); setPage(1); }}
                placeholder="Filter by state..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400" />
            </div>
            {activeFilters > 0 && (
              <div className="col-span-4 flex justify-end">
                <button onClick={() => { setFilters({ type: '', status: '', city: '', state: '' }); setPage(1); }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer">Clear All Filters</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  { label: 'Code', col: null },
                  { label: 'Customer', col: 'name' },
                  { label: 'Contact', col: null },
                  { label: 'Type', col: null },
                  { label: 'City', col: null },
                  { label: 'Bills', col: 'totalBills' },
                  { label: 'Total Purchase', col: 'totalPurchase' },
                  { label: 'Outstanding', col: 'outstanding' },
                  { label: 'Last Purchase', col: 'lastPurchase' },
                  { label: 'Status', col: null },
                  { label: 'Actions', col: null, right: true },
                ].map(({ label, col, right }) => (
                  <th key={label}
                    className={`py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : ''} ${col ? 'cursor-pointer hover:text-slate-600 select-none' : ''}`}
                    onClick={col ? () => toggleSort(col) : undefined}>
                    <span className="inline-flex items-center gap-1">{label}{col && <SortIcon col={col} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">{search || activeFilters ? 'No customers match your search' : 'No customers yet'}</p>
                    <p className="text-xs text-slate-300 mt-1">{search || activeFilters ? 'Try a different search or clear filters' : 'Add your first customer to get started'}</p>
                    {!search && !activeFilters && (
                      <button onClick={() => setShowModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-700 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add First Customer
                      </button>
                    )}
                  </td>
                </tr>
              ) : paginated.map(c => {
                const s = customerStats[c.id] || {};
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{c.code}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{c.name}</p>
                          {c.company && <p className="text-[10px] text-slate-400 font-medium">{c.company}</p>}
                          {c.labels?.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {c.labels.slice(0, 2).map(l => {
                                const ls = LABEL_STYLES[l] || {};
                                return <span key={l} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ls.bg} ${ls.text}`}>{l}</span>;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-700">{c.mobile}</p>
                      {c.email && <p className="text-[10px] text-slate-400">{c.email}</p>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ${TYPE_COLORS[c.type] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{c.type}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-xs text-slate-600 font-medium">{c.city || '—'}</p>
                      {c.state && <p className="text-[10px] text-slate-400">{c.state}</p>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className="font-extrabold text-slate-800">{s.totalBills || 0}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">{fmt(s.totalPurchase)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`font-bold ${(s.outstanding || 0) > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{fmt(s.outstanding)}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">{fmtDate(s.lastPurchase)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ${STATUS_COLORS[c.status] || ''}`}>
                        {c.status === 'Active' ? <CheckCircle className="w-2.5 h-2.5 mr-1" /> : <XCircle className="w-2.5 h-2.5 mr-1" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onViewProfile?.(c.id)} title="View Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onCreateInvoice?.(c)} title="Create Invoice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditCustomer(c); setShowModal(true); }} title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(c)} title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400 font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} customers
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-all">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${page === p ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-all">
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <CustomerModal
          initial={editCustomer}
          onSave={handleSaveCustomer}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-extrabold text-slate-800 mb-1">Delete Customer?</h3>
            <p className="text-xs text-slate-500 mb-5">
              <span className="font-bold text-slate-700">{deleteConfirm.name}</span> will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-rose-500/20">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Customers;
