import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { useCRM } from '../context/CRMContext';
import * as crmService from '../services/crmService';
import { 
  ArrowLeft, FileDown, Save, ChevronDown, Search, Trash2, Plus, Check,
  User, X, AlertCircle, Clock, TrendingDown, TrendingUp
} from 'lucide-react';

export const NewBilling = ({ onBack, draftData, prefillCustomer }) => {
  const { showToast, ToastContainer } = useToast();
  const { customers, syncFromInvoice, getCustomerPricing } = useCRM();
  const isEditingDraft = !!draftData;

  // ── Customer fields ───────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerType, setCustomerType] = useState('retail');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGST, setCustomerGST] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    { id: Date.now(), product: '', variant: '', qty: 1, price: 0, disc: 0, tax: 0 }
  ]);

  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending (Credit)');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [summary, setSummary] = useState({ subtotal: 0, discount: 0, tax: 0, grandTotal: 0, pendingBalance: 0 });
  const [invoiceId, setInvoiceId] = useState('');
  const [productList, setProductList] = useState([]);
  const [priceHints, setPriceHints] = useState({});

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // ── Pre-fill from customer passed in (from Customers page) ─
  useEffect(() => {
    if (prefillCustomer) {
      fillCustomerFields(prefillCustomer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillCustomerFields = (c) => {
    setSelectedCustomer(c);
    setCustomerName(c.name || '');
    setCustomerPhone(c.mobile || '');
    setCustomerCompany(c.company || '');
    setCustomerEmail(c.email || '');
    setCustomerGST(c.gst || '');
    setCustomerCity(c.city || '');
    setCustomerState(c.state || '');
    setBillingAddress(c.address || '');
    setCustomerSearchQuery(c.name || '');
    setShowCustomerDropdown(false);
  };

  // ── Customer live search ───────────────────────────────────
  useEffect(() => {
    const q = customerSearchQuery.trim();
    if (!q) { setCustomerSearchResults([]); return; }
    const results = crmService.searchCustomers(customers, q).slice(0, 6);
    setCustomerSearchResults(results);
  }, [customerSearchQuery, customers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Pre-fill draft data ────────────────────────────────────
  useEffect(() => {
    if (draftData) {
      setCustomerName(draftData.client || '');
      setCustomerPhone(draftData.phone || '');
      setBillingAddress(draftData.address || '');
      setNotes(draftData.notes || '');
      setPaymentMethod(draftData.paymentMethod || 'Cash');
      setPaymentStatus(draftData.paymentStatus || 'Pending (Credit)');
      setAmountReceived(draftData.amountReceived || 0);
      setInvoiceId(draftData.id || draftData.invoiceId || '');
      if (draftData.items?.length > 0) {
        setItems(draftData.items.map((item, idx) => ({
          id: Date.now() + idx,
          product: item.product || '',
          variant: item.variant || '',
          qty: item.qty || 1,
          price: item.price || 0,
          disc: item.disc || 0,
          tax: item.tax || 0,
        })));
      }
      // Try to find matching customer
      if (draftData.phone) {
        const c = customers.find(cust => cust.mobile === draftData.phone);
        if (c) { setSelectedCustomer(c); setCustomerSearchQuery(c.name); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch products ─────────────────────────────────────────
  useEffect(() => {
    api.get('/products').then(data => { if (Array.isArray(data)) setProductList(data); }).catch(() => {});
  }, []);

  // ── Fetch next invoice ID ──────────────────────────────────
  useEffect(() => {
    if (isEditingDraft) return;
    api.get('/invoices').then(invs => {
      const count = Array.isArray(invs) ? invs.length : 0;
      setInvoiceId(`INV-2026-${String(count + 1).padStart(3, '0')}`);
    }).catch(() => {
      setInvoiceId(`INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
    });
  }, [isEditingDraft]);

  // ── Calculate totals ───────────────────────────────────────
  useEffect(() => {
    let subtotal = 0, discount = 0, tax = 0;
    items.forEach(item => {
      const qty = parseFloat(item.qty) || 0, price = parseFloat(item.price) || 0;
      const disc = parseFloat(item.disc) || 0, taxPct = parseFloat(item.tax) || 0;
      const sub = qty * price;
      const d = sub * (disc / 100);
      const t = (sub - d) * (taxPct / 100);
      subtotal += sub; discount += d; tax += t;
    });
    const grandTotal = subtotal - discount + tax;
    setSummary({ subtotal, discount, tax, grandTotal, pendingBalance: Math.max(0, grandTotal - (parseFloat(amountReceived) || 0)) });
  }, [items, amountReceived]);

  // ── Update price hints when customer or product changes ────
  const updatePriceHint = async (itemId, productName) => {
    if (!selectedCustomer || !productName) {
      setPriceHints(h => { const n = { ...h }; delete n[itemId]; return n; });
      return;
    }
    try {
      const pricing = await getCustomerPricing(selectedCustomer._id || selectedCustomer.id, productName);
      if (pricing) {
        setPriceHints(h => ({ ...h, [itemId]: {
          lastPrice: pricing.lastPrice,
          avgPrice: pricing.averagePrice,
          lastDate: pricing.lastPurchaseDate,
          lastInvoiceId: pricing.lastInvoiceId,
        }}));
      } else {
        setPriceHints(h => { const n = { ...h }; delete n[itemId]; return n; });
      }
    } catch (e) {
      setPriceHints(h => { const n = { ...h }; delete n[itemId]; return n; });
    }
  };

  // ── Item handlers ──────────────────────────────────────────
  const handleAddItemRow = () => setItems([...items, { id: Date.now(), product: '', variant: '', qty: 1, price: 0, disc: 0, tax: 0 }]);
  const handleRemoveItemRow = (id) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const preventInvalidNumberInput = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      let update = { [field]: value };
      if (field === 'variant' && value !== '') {
        const found = productList.find(p => p.name === item.product);
        if (found?.variantDetails) {
          const vd = found.variantDetails.find(v => v.variantName === value);
          if (vd) update.price = customerType === 'wholesale' ? vd.wholesalePrice : vd.retailPrice;
        }
      }
      return { ...item, ...update };
    }));
  };

  // When customer type changes, re-price items
  useEffect(() => {
    setItems(prev => prev.map(item => {
      if (!item.product) return item;
      const found = productList.find(p => p.name === item.product);
      if (!found) return item;
      let price = customerType === 'wholesale' ? found.wholesalePrice : found.retailPrice;
      if (item.variant && found.variantDetails) {
        const vd = found.variantDetails.find(v => v.variantName === item.variant);
        if (vd) price = customerType === 'wholesale' ? vd.wholesalePrice : vd.retailPrice;
      }
      return { ...item, price };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerType, productList]);

  const handleProductSelect = async (id, productName) => {
    const found = productList.find(p => p.name === productName);

    // Check customer-specific price first
    let price = 0;
    if (selectedCustomer && productName) {
      try {
        const pricing = await getCustomerPricing(selectedCustomer._id || selectedCustomer.id, productName);
        if (pricing) {
          price = pricing.lastPrice;
        } else if (found) {
          price = customerType === 'wholesale' ? found.wholesalePrice : found.retailPrice;
        }
      } catch (e) {
        if (found) price = customerType === 'wholesale' ? found.wholesalePrice : found.retailPrice;
      }
    } else if (found) {
      price = customerType === 'wholesale' ? found.wholesalePrice : found.retailPrice;
    }

    setItems(items.map(item => item.id === id ? { ...item, product: productName, variant: '', price } : item));
    await updatePriceHint(id, productName);
  };

  // ── Validation ─────────────────────────────────────────────
  const hasPartialData = () =>
    customerName.trim() || customerPhone.trim() || billingAddress.trim() || items.some(i => i.product.trim());

  // ── Save invoice ───────────────────────────────────────────
  const handleSaveInvoice = async (overrideStatus) => {
    if (overrideStatus !== 'Draft') {
      if (!customerName.trim() || !customerPhone.trim()) {
        showToast('Please fill in Customer Name and Phone Number', 'error'); return;
      }
      if (!/^[0-9]{10}$/.test(customerPhone.trim())) {
        showToast('Phone number must be exactly 10 digits', 'error'); return;
      }
      if (items.some(i => !i.product.trim())) {
        showToast('Please ensure all items have a product selected', 'error'); return;
      }
    }

    const calculatedPayment = overrideStatus === 'Draft' ? 'Draft'
      : (paymentStatus.includes('Paid') ? 'Paid' : (paymentStatus.includes('Partially') ? 'Partial' : 'Pending'));

    const payload = {
      invoiceId,
      client: customerName.trim() || 'Draft Customer',
      phone: customerPhone.trim() || '',
      company: customerCompany.trim(),
      email: customerEmail.trim(),
      gst: customerGST.trim(),
      city: customerCity.trim(),
      state: customerState.trim(),
      address: billingAddress.trim(),
      issueDate: new Date(),
      payment: calculatedPayment,
      delivery: 'Processing',
      items: items.filter(i => i.product.trim()).map(i => ({
        product: i.product.trim(),
        variant: i.variant || '',
        qty: parseInt(i.qty) || 0,
        price: parseFloat(i.price) || 0,
        disc: parseFloat(i.disc) || 0,
        tax: parseFloat(i.tax) || 0,
        total: (parseInt(i.qty) || 0) * (parseFloat(i.price) || 0) * (1 - (parseFloat(i.disc) || 0) / 100),
      })),
      subtotal: summary.subtotal,
      discount: summary.discount,
      tax: summary.tax,
      grandTotal: summary.grandTotal,
      amountReceived: parseFloat(amountReceived) || 0,
      paymentStatus: overrideStatus === 'Draft' ? 'Draft' : paymentStatus,
      paymentMethod,
      notes: notes.trim(),
      customerType,
    };

    try {
      if (isEditingDraft && draftData) {
        const draftId = draftData.id || draftData.invoiceId;
        if (draftId) await api.delete(`/invoices/${draftId}`);
      }
      await api.post('/invoices', payload);

      // ── Auto-sync to CRM ────────────────────────────────────
      if (overrideStatus !== 'Draft') {
        await syncFromInvoice(payload);
      }

      if (overrideStatus !== 'Draft') showToast('Invoice saved successfully!', 'success');
      else showToast('Draft saved!', 'info', 2000);
      if (onBack) onBack();
    } catch (error) {
      showToast(error.message || 'Error saving invoice', 'error');
    }
  };

  const handleBack = async () => {
    if (hasPartialData()) await handleSaveInvoice('Draft');
    else if (onBack) onBack();
  };

  useEffect(() => {
    const h = (e) => { if (hasPartialData()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  });

  const inputClass = "w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <ToastContainer />

      {isEditingDraft && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-bold text-amber-700">Editing Draft: <span className="font-mono">{invoiceId}</span> — click <strong>Save Invoice</strong> to finalize.</p>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <button onClick={handleBack} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">New Invoice / Bill</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Drafting Invoice #{invoiceId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button onClick={() => showToast('Export successful!', 'success')} className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
            <FileDown className="w-4 h-4" /><span>Export PDF</span>
          </button>
          <button onClick={() => handleSaveInvoice('Draft')} className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer shadow-sm">
            <Save className="w-4 h-4 text-slate-400" /><span>Save Draft</span>
          </button>
          <button onClick={() => handleSaveInvoice('Pending')} className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md shadow-emerald-500/10">
            <Check className="w-4 h-4" /><span>Save Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Customer Details</h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                {['retail', 'wholesale'].map(t => (
                  <button key={t} type="button" onClick={() => setCustomerType(t)}
                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all cursor-pointer capitalize ${customerType === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Smart Customer Search ── */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Search Existing Customer
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={customerSearchQuery}
                  onChange={e => { setCustomerSearchQuery(e.target.value); setShowCustomerDropdown(true); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search by name, mobile, GST, company..."
                  className="w-full pl-9 pr-10 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {(customerSearchQuery || selectedCustomer) && (
                  <button onClick={() => { setCustomerSearchQuery(''); setSelectedCustomer(null); setShowCustomerDropdown(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dropdown */}
                {showCustomerDropdown && (customerSearchResults.length > 0 || customerSearchQuery.length > 1) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {customerSearchResults.length > 0 ? (
                      <>
                        {customerSearchResults.map(c => (
                          <button key={c.id} onClick={() => fillCustomerFields(c)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors cursor-pointer text-left border-b border-slate-50 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{c.mobile}{c.company ? ` · ${c.company}` : ''}</p>
                            </div>
                            <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">{c.code}</span>
                          </button>
                        ))}
                        <div className="border-t border-slate-100">
                          <button onClick={() => { setShowCustomerDropdown(false); setCustomerName(customerSearchQuery); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Continue as new customer
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-4">
                        <p className="text-xs text-slate-500 font-medium mb-2">No customers found for "{customerSearchQuery}"</p>
                        <button onClick={() => { setShowCustomerDropdown(false); setCustomerName(customerSearchQuery); }}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 cursor-pointer hover:bg-emerald-100 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Add as new customer after invoice
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-bold text-emerald-700">Customer selected: {selectedCustomer.name} ({selectedCustomer.code})</p>
                </div>
              )}
            </div>

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name <span className="text-rose-500 font-extrabold">*</span></label>
                <input type="text" required maxLength={100} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number <span className="text-rose-500 font-extrabold">*</span></label>
                <input type="tel" required maxLength={10} value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className={`w-full px-4 py-2.5 bg-slate-50/50 border rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${customerPhone.length > 0 && customerPhone.length !== 10 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
                />
              </div>
            </div>

            {/* Company + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                <input type="text" maxLength={100} value={customerCompany} onChange={e => setCustomerCompany(e.target.value)} placeholder="Company (optional)" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input type="email" maxLength={100} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" className={inputClass} />
              </div>
            </div>

            {/* GST + City + State */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GST Number</label>
                <input type="text" value={customerGST} onChange={e => setCustomerGST(e.target.value.toUpperCase())} placeholder="GST No." maxLength={15} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">City</label>
                <input type="text" maxLength={50} value={customerCity} onChange={e => setCustomerCity(e.target.value)} placeholder="City" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                <input type="text" maxLength={50} value={customerState} onChange={e => setCustomerState(e.target.value)} placeholder="State" className={inputClass} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Billing Address</label>
              <textarea rows="2" maxLength={200} value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Full address..." className={inputClass} />
            </div>
          </div>

          {/* Order Items Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-3">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 w-[30%]">Product</th>
                    <th className="pb-3 w-[18%]">Variant</th>
                    <th className="pb-3 w-[8%]">QTY</th>
                    <th className="pb-3 w-[18%]">Price (₹)</th>
                    <th className="pb-3 w-[10%]">Disc %</th>
                    <th className="pb-3 w-[10%]">Tax %</th>
                    <th className="pb-3 w-[6%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold">
                  {items.map((item) => {
                    const hint = priceHints[item.id];
                    return (
                      <tr key={item.id}>
                        <td className="py-3 pr-2 align-top">
                          <select value={item.product} onChange={e => handleProductSelect(item.id, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer font-bold text-slate-700 text-xs">
                            <option value="">Select Product...</option>
                            {productList.map(p => <option key={p._id} value={p.name}>{p.name} (SKU: {p.sku})</option>)}
                          </select>
                        </td>
                        <td className="py-3 pr-2 align-top">
                          {(() => {
                            const prod = productList.find(p => p.name === item.product);
                            const hasDetails = prod?.variantDetails?.length > 0;
                            const hasLegacy = prod?.variants?.length > 0;
                            if (hasDetails) return (
                              <select value={item.variant} onChange={e => handleItemChange(item.id, 'variant', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-[11px] font-semibold text-slate-600 cursor-pointer">
                                <option value="">Select Variant...</option>
                                {prod.variantDetails.map(vd => <option key={vd.sku} value={vd.variantName}>{vd.variantName} (Stock: {vd.qty})</option>)}
                              </select>
                            );
                            if (hasLegacy) return (
                              <select value={item.variant} onChange={e => handleItemChange(item.id, 'variant', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-[11px] cursor-pointer">
                                <option value="">Select Variant...</option>
                                {prod.variants.map(vg => vg.options.map(opt => <option key={`${vg.group}-${opt}`} value={`${vg.group}: ${opt}`}>{vg.group}: {opt}</option>))}
                              </select>
                            );
                            return <select disabled className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-[11px] opacity-40 cursor-not-allowed"><option>No Variants</option></select>;
                          })()}
                        </td>
                        <td className="py-3 pr-2 align-top">
                          <input type="number" min="1" value={item.qty === 0 ? '' : item.qty}
                            onChange={e => handleItemChange(item.id, 'qty', e.target.value)} onKeyDown={preventInvalidNumberInput}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-center" />
                        </td>
                        <td className="py-3 pr-2 align-top">
                          <input type="number" min="0" value={item.price === 0 ? '' : item.price}
                            onChange={e => handleItemChange(item.id, 'price', e.target.value)} onKeyDown={preventInvalidNumberInput}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-right" />
                          {/* Price Hint */}
                          {hint && (
                            <div className="mt-1 px-1 space-y-0.5">
                              <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Last: ₹{hint.lastPrice}
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium">Avg: ₹{hint.avgPrice?.toFixed(0)}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-2 align-top">
                          <input type="number" min="0" max="100" value={item.disc === 0 ? '' : item.disc}
                            onChange={e => handleItemChange(item.id, 'disc', e.target.value)} onKeyDown={preventInvalidNumberInput}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-center" />
                        </td>
                        <td className="py-3 pr-2 align-top">
                          <select value={item.tax} onChange={e => handleItemChange(item.id, 'tax', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer">
                            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td className="py-3 text-right align-top">
                          <button type="button" onClick={() => handleRemoveItemRow(item.id)} disabled={items.length === 1}
                            className={`p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer ${items.length === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={handleAddItemRow}
              className="w-full py-3 border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-600 font-bold transition-all bg-slate-50/20 hover:bg-emerald-50/10 cursor-pointer">
              <Plus className="w-4 h-4" /><span>Add Another Row</span>
            </button>
          </div>
        </div>

        {/* Right: Payment Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-3">Payment Summary</h3>
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="text-slate-800 font-bold">₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">- ₹{summary.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estimated Tax (GST)</span>
                <span className="text-slate-800 font-bold">+ ₹{summary.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-800">Grand Total</span>
                <span className="text-base font-extrabold text-slate-900">₹{summary.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Received (₹)</label>
              <input type="number" min="0" value={amountReceived === 0 ? '' : amountReceived}
                onChange={e => setAmountReceived(e.target.value)} onKeyDown={preventInvalidNumberInput} placeholder="0"
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500" />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Pending Balance:</span>
              <span className="text-sm font-extrabold text-emerald-600">₹{summary.pendingBalance.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer">
                <option value="Pending (Credit)">Pending (Credit)</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer">
                {['Cash', 'Card', 'UPI', 'Net Banking', 'Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-3">Notes &amp; Terms</h3>
            <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add terms and conditions..." className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBilling;
