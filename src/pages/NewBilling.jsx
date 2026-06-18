import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { 
  ArrowLeft, 
  FileDown, 
  Save, 
  ChevronDown, 
  Search, 
  Trash2, 
  Plus, 
  Check 
} from 'lucide-react';

export const NewBilling = ({ onBack, draftData }) => {
  const { showToast, ToastContainer } = useToast();
  const isEditingDraft = !!draftData;

  const [customerType, setCustomerType] = useState('retail');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState([
    { id: Date.now(), product: '', variant: '', qty: 1, price: 0, disc: 0, tax: 0 }
  ]);

  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending (Credit)');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [summary, setSummary] = useState({
    subtotal: 0, discount: 0, tax: 0, grandTotal: 0, pendingBalance: 0
  });

  const [invoiceId, setInvoiceId] = useState('');
  const [productList, setProductList] = useState([]);

  // Pre-fill all fields when editing a draft
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
      if (draftData.items && draftData.items.length > 0) {
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch product list for autocomplete
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get('/products');
        if (Array.isArray(data)) {
          setProductList(data);
        }
      } catch (err) {
        console.error('Error fetching products list:', err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch sequential invoice ID (only when NOT editing a draft)
  useEffect(() => {
    if (isEditingDraft) return; // keep draft's own invoiceId
    const fetchNextId = async () => {
      try {
        const invoices = await api.get('/invoices');
        const count = Array.isArray(invoices) ? invoices.length : 0;
        const nextNum = String(count + 1).padStart(3, '0');
        setInvoiceId(`INV-2026-${nextNum}`);
      } catch (err) {
        console.error('Error fetching invoices count:', err);
        setInvoiceId(`INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
      }
    };
    fetchNextId();
  }, [isEditingDraft]);

  // Calculate totals whenever items or amountReceived changes
  useEffect(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    items.forEach(item => {
      const itemSubtotal = item.qty * item.price;
      const itemDiscount = itemSubtotal * (item.disc / 100);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (item.tax / 100);

      subtotal += itemSubtotal;
      discount += itemDiscount;
      tax += itemTax;
    });

    const grandTotal = subtotal - discount + tax;
    const pendingBalance = Math.max(0, grandTotal - amountReceived);

    setSummary({
      subtotal,
      discount,
      tax,
      grandTotal,
      pendingBalance
    });
  }, [items, amountReceived]);

  const handleAddItemRow = () => {
    setItems([...items, { id: Date.now(), product: '', variant: '', qty: 1, price: 0, disc: 0, tax: 0 }]);
  };

  const handleRemoveItemRow = (id) => {
    if (items.length === 1) return; // Keep at least one row
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let update = { [field]: value };
        if (field === 'variant' && value !== '') {
          // Find product
          const found = productList.find(p => p.name === item.product);
          if (found && found.variantDetails) {
            const vDetail = found.variantDetails.find(v => v.variantName === value);
            if (vDetail) {
               update.price = customerType === 'wholesale' ? vDetail.wholesalePrice : vDetail.retailPrice;
            }
          }
        }
        return { ...item, ...update };
      }
      return item;
    }));
  };

  // Update prices of existing items if the customerType changes
  useEffect(() => {
    setItems(prevItems => prevItems.map(item => {
      if (item.product) {
        const found = productList.find(p => p.name === item.product);
        if (found) {
          let price = customerType === 'wholesale' ? found.wholesalePrice : found.retailPrice;
          if (item.variant && found.variantDetails) {
            const vDetail = found.variantDetails.find(v => v.variantName === item.variant);
            if (vDetail) {
              price = customerType === 'wholesale' ? vDetail.wholesalePrice : vDetail.retailPrice;
            }
          }
          return { ...item, price };
        }
      }
      return item;
    }));
  }, [customerType, productList]);

  // Merge product name + price into a single state update to avoid stale-closure overwrite
  const handleProductSelect = (id, productName) => {
    const found = productList.find(p => p.name === productName);
    setItems(items.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          product: productName, 
          variant: '', 
          price: found ? (customerType === 'wholesale' ? found.wholesalePrice : found.retailPrice) : item.price 
        };
      }
      return item;
    }));
  };


  // Check if form has any meaningful data entered
  const hasPartialData = () => {
    return (
      customerName.trim() ||
      customerPhone.trim() ||
      billingAddress.trim() ||
      items.some(item => item.product.trim())
    );
  };

  const handleSaveInvoice = async (overrideStatus) => {
    // For draft, relax validation — save whatever is filled
    if (overrideStatus !== 'Draft') {
      if (!customerName.trim() || !customerPhone.trim()) {
        showToast('Please fill in Customer Name and Phone Number', 'error');
        return;
      }
      if (!/^[0-9]{10}$/.test(customerPhone.trim())) {
        showToast('Phone number must be exactly 10 digits', 'error');
        return;
      }
      if (items.some(item => !item.product.trim())) {
        showToast('Please ensure all items have a product selected', 'error');
        return;
      }
    }

    const calculatedPayment = overrideStatus === 'Draft' 
      ? 'Draft'
      : (paymentStatus.includes('Paid') ? 'Paid' : (paymentStatus.includes('Partially') ? 'Partial' : 'Pending'));

    const payload = {
      invoiceId,
      client: customerName.trim() || 'Draft Customer',
      phone: customerPhone.trim() || '',
      address: billingAddress.trim(),
      issueDate: new Date(),
      payment: calculatedPayment,
      delivery: 'Processing',
      items: items
        .filter(item => item.product.trim())
        .map(item => ({
          product: item.product.trim(),
          variant: item.variant || '',
          qty: parseInt(item.qty) || 0,
          price: parseFloat(item.price) || 0,
          disc: parseFloat(item.disc) || 0,
          tax: parseFloat(item.tax) || 0,
          total: (parseInt(item.qty) || 0) * (parseFloat(item.price) || 0) * (1 - (parseFloat(item.disc) || 0) / 100)
        })),
      subtotal: summary.subtotal,
      discount: summary.discount,
      tax: summary.tax,
      grandTotal: summary.grandTotal,
      amountReceived: parseFloat(amountReceived) || 0,
      paymentStatus: overrideStatus === 'Draft' ? 'Draft' : paymentStatus,
      paymentMethod,
      notes: notes.trim()
    };

    try {
      // If editing a draft, delete the old draft first, then save as new invoice
      if (isEditingDraft && draftData) {
        const draftId = draftData.id || draftData.invoiceId;
        if (draftId) {
          await api.delete(`/invoices/${draftId}`);
        }
      }
      await api.post('/invoices', payload);
      if (overrideStatus !== 'Draft') {
        showToast('Invoice saved successfully!', 'success');
      } else {
        showToast('Draft saved!', 'info', 2000);
      }
      if (onBack) onBack();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showToast(error.message || 'Error saving invoice', 'error');
    }
  };

  // Auto-save as draft when user clicks Back and has partial data
  const handleBack = async () => {
    if (hasPartialData()) {
      await handleSaveInvoice('Draft');
    } else {
      if (onBack) onBack();
    }
  };

  // Warn + auto-save on browser/tab close if there is partial data
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasPartialData()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <ToastContainer />

      {/* Draft editing banner */}
      {isEditingDraft && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-bold text-amber-700">
            Editing Draft: <span className="font-mono">{invoiceId}</span> — make your changes and click <strong>Save Invoice</strong> to finalize.
          </p>
        </div>
      )}
      {/* Top Navigation / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack}
            className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">New Invoice / Bill</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Drafting Invoice #{invoiceId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={() => handleSaveInvoice('Draft')}
            className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-650 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4 text-slate-400" />
            <span>Save Draft</span>
          </button>
          <button 
            onClick={() => handleSaveInvoice('Pending')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Check className="w-4 h-4" />
            <span>Save Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Forms (Customer + Items) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Customer Details</h3>
              
              {/* Retail / Wholesale Toggles */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setCustomerType('retail')}
                  className={`px-4 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    customerType === 'retail'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Retail
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('wholesale')}
                  className={`px-4 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    customerType === 'wholesale'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Wholesale
                </button>
              </div>
            </div>


            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Full Name <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Phone Number <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className={`w-full px-4 py-2.5 bg-slate-50/50 border rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${
                    customerPhone.length > 0 && customerPhone.length !== 10
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Billing Address</label>
              <textarea
                rows="2"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Full address..."
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Order Items Table Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-3">Order Items</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-2">
                    <th className="pb-3 w-[30%]">Product Selection</th>
                    <th className="pb-3 w-[20%]">Variant</th>
                    <th className="pb-3 w-[10%]">QTY</th>
                    <th className="pb-3 w-[15%]">Price (₹)</th>
                    <th className="pb-3 w-[10%]">Disc (%)</th>
                    <th className="pb-3 w-[10%]">Tax (%)</th>
                    <th className="pb-3 text-right w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-2 align-top">
                        <select
                          value={item.product}
                          onChange={(e) => handleProductSelect(item.id, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer font-bold text-slate-700"
                        >
                          <option value="">Select Product...</option>
                          {productList.map(p => (
                            <option key={p._id} value={p.name}>
                              {p.name} (SKU: {p.sku}) - ₹{p.retailPrice}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-2 align-top">
                        {(() => {
                          const prod = productList.find(p => p.name === item.product);
                          const hasDetails = prod && prod.variantDetails && prod.variantDetails.length > 0;
                          const hasLegacyVariants = prod && prod.variants && prod.variants.length > 0;
                          
                          if (hasDetails) {
                            return (
                              <select
                                value={item.variant}
                                onChange={(e) => handleItemChange(item.id, 'variant', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-[11px] font-semibold text-slate-600 cursor-pointer"
                              >
                                <option value="">Select Variant...</option>
                                {prod.variantDetails.map((vd) => (
                                  <option key={vd.sku} value={vd.variantName}>
                                    {vd.variantName} (Stock: {vd.qty})
                                  </option>
                                ))}
                              </select>
                            );
                          } else if (hasLegacyVariants) {
                            return (
                              <select
                                value={item.variant}
                                onChange={(e) => handleItemChange(item.id, 'variant', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-[11px] font-semibold text-slate-600 cursor-pointer"
                              >
                                <option value="">Select Variant...</option>
                                {prod.variants.map((vGroup) => (
                                   vGroup.options.map((opt) => (
                                     <option key={`${vGroup.group}-${opt}`} value={`${vGroup.group}: ${opt}`}>{vGroup.group}: {opt}</option>
                                   ))
                                ))}
                              </select>
                            );
                          } else {
                            return (
                              <select disabled className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-[11px] font-semibold text-slate-600 opacity-50 cursor-not-allowed">
                                <option value="">No Variants</option>
                              </select>
                            );
                          }
                        })()}
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-center"
                        />
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-right"
                        />
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.disc}
                          onChange={(e) => handleItemChange(item.id, 'disc', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none text-center"
                        />
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <select
                          value={item.tax}
                          onChange={(e) => handleItemChange(item.id, 'tax', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-3 text-right align-top">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          className={`p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer ${
                            items.length === 1 ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Another Row dashed button */}
            <button
              type="button"
              onClick={handleAddItemRow}
              className="w-full py-3 border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-600 font-bold transition-all bg-slate-50/20 hover:bg-emerald-50/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Row</span>
            </button>
          </div>
        </div>

        {/* Right Forms (Payment Summary + Terms) */}
        <div className="space-y-6">
          
          {/* Payment Summary Card */}
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

            {/* Amount Received Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Received (₹)</label>
              <input
                type="number"
                min="0"
                value={amountReceived}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
              />
            </div>

            {/* Pending Balance indicator */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Pending Balance:</span>
              <span className="text-sm font-extrabold text-emerald-600">₹{summary.pendingBalance.toFixed(2)}</span>
            </div>

            {/* Payment Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Pending (Credit)">Pending (Credit)</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>

            {/* Payment Method Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Notes & Terms Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-3">Notes & Terms</h3>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add terms and conditions..."
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewBilling;
