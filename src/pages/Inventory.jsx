import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  Search,
  Plus,
  X,
  Download,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingUp,
  Boxes,
  HelpCircle,
  Pencil,
  Trash2,
  AlertCircle,
  TrendingDown,
  BarChart3,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

export const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isValuationOpen, setIsValuationOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Form State
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    category: 'Necklaces',
    warehouse: 'Main WH - A1',
    quantity: 0,
    unitPrice: 0,
    status: 'In Stock',
    variant: '',
    baseSku: ''
  });

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await api.get('/inventory');
      if (Array.isArray(data)) {
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products');
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Sync all products into inventory, then refresh
  const syncAndRefresh = async () => {
    try {
      setSyncing(true);
      setSyncMsg('');
      const result = await api.post('/inventory/sync', {});
      if (result && result.message) {
        setSyncMsg(result.message);
        setTimeout(() => setSyncMsg(''), 4000);
      }
      await fetchInventory();
    } catch (error) {
      console.error('Error syncing products to inventory:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchProducts();
      // Auto-sync first, then load inventory
      try {
        await api.post('/inventory/sync', {});
      } catch (e) {
        // silent fail — Atlas might be disconnected
      }
      await fetchInventory();
    };
    init();
  }, []);

  // Derived Summary Metrics
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalItemsInStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockAlerts = inventory.filter(item => item.quantity < 10 && item.quantity > 0).length;
  const deadStockItems = inventory.filter(item => item.status === 'Dead Stock').length;

  const uniqueCategories = ['All', ...new Set(inventory.map(item => item.category))];
  const uniqueWarehouses = ['All', ...new Set(inventory.map(item => item.warehouse))];

  // Search and Double Filters
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesWarehouse = selectedWarehouse === 'All' || item.warehouse === selectedWarehouse;

    return matchesSearch && matchesCategory && matchesWarehouse;
  });

  // Export CSV Helper
  const exportToCSV = () => {
    const csvRows = [];
    const headers = ['SKU', 'PRODUCT NAME', 'CATEGORY', 'WAREHOUSE', 'QUANTITY', 'UNIT PRICE', 'TOTAL VALUE', 'STATUS'];
    csvRows.push(headers.join(','));

    filteredInventory.forEach(item => {
      const totalValue = item.quantity * item.unitPrice;
      const values = [
        `"${item.sku}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${item.warehouse}"`,
        item.quantity,
        item.unitPrice,
        totalValue,
        `"${item.status}"`
      ];
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Form Helpers
  const [variantQuantities, setVariantQuantities] = useState({});
  const [expandedProducts, setExpandedProducts] = useState({});

  const toggleExpand = (sku) => {
    setExpandedProducts(prev => ({ ...prev, [sku]: !prev[sku] }));
  };

  const openAddModal = () => {
    setItemForm({
      sku: '',
      name: '',
      category: 'Necklaces',
      warehouse: 'Main WH - A1',
      quantity: '',
      unitPrice: '',
      status: 'In Stock',
      variant: '',
      baseSku: ''
    });
    setVariantQuantities({});
    setModalType('add');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setItemForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      warehouse: item.warehouse,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      status: item.status,
      variant: item.variant || '',
      baseSku: item.sku
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (modalType === 'add' && Object.keys(variantQuantities).length > 0) {
      // Bulk Submit
      const itemsToSubmit = [];
      Object.entries(variantQuantities).forEach(([variantName, qty]) => {
        if (qty !== '' && parseInt(qty) >= 0) {
          const cleanV = variantName.replace(/[^a-zA-Z0-9]/g, '');
          const qtyNum = parseInt(qty) || 0;
          let finalStatus = 'In Stock';
          if (qtyNum === 0) finalStatus = 'Out of Stock';
          else if (qtyNum < 10) finalStatus = 'Low Stock';
          
          itemsToSubmit.push({
            sku: `${itemForm.baseSku}-${cleanV}`,
            baseSku: itemForm.baseSku,
            name: itemForm.name.trim(),
            category: itemForm.category,
            warehouse: itemForm.warehouse,
            quantity: qtyNum,
            unitPrice: parseFloat(itemForm.unitPrice) || 0,
            status: finalStatus,
            variant: variantName
          });
        }
      });
      
      if (itemsToSubmit.length === 0) {
        alert("Please enter a quantity for at least one variant.");
        return;
      }
      
      try {
        await api.post('/inventory/bulk', { items: itemsToSubmit });
        fetchInventory();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving bulk inventory:', error);
        alert(error.message || 'Error saving inventory');
      }
      return;
    }

    if (!itemForm.sku.trim() || !itemForm.name.trim()) return;

    // Auto calculate status from quantity if not manually flagged dead stock
    let finalStatus = itemForm.status;
    const qtyNum = parseInt(itemForm.quantity) || 0;
    if (finalStatus !== 'Dead Stock') {
      if (qtyNum === 0) {
        finalStatus = 'Out of Stock';
      } else if (qtyNum < 10) {
        finalStatus = 'Low Stock';
      } else {
        finalStatus = 'In Stock';
      }
    }

    const itemData = {
      sku: itemForm.sku.trim(),
      name: itemForm.name.trim(),
      category: itemForm.category,
      warehouse: itemForm.warehouse,
      quantity: qtyNum,
      unitPrice: parseFloat(itemForm.unitPrice) || 0,
      status: finalStatus,
      variant: itemForm.variant
    };

    try {
      if (modalType === 'add') {
        if (inventory.some(item => item.sku.toLowerCase() === itemData.sku.toLowerCase())) {
          alert("An item with this SKU already exists!");
          return;
        }
        await api.post('/inventory', itemData);
      } else {
        await api.put(`/inventory/${itemForm.sku}`, itemData);
      }
      fetchInventory();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert(error.message || 'Error saving inventory item');
    }
  };


  // Delete Handler — handles single item, group by baseSku, and group by name
  const handleDeleteItem = async (id) => {
    try {
      if (id && id.startsWith('name:')) {
        // Delete ALL inventory items with this product name
        const productName = id.replace('name:', '');
        const itemsToDelete = inventory.filter(item => item.name === productName);
        await Promise.all(itemsToDelete.map(item => api.delete(`/inventory/${item.sku}`)));
      } else if (id && id.startsWith('group-')) {
        // Legacy: delete all items matching baseSku
        const baseSku = id.replace('group-', '');
        const itemsToDelete = inventory.filter(item => (item.baseSku || item.sku) === baseSku);
        await Promise.all(itemsToDelete.map(item => api.delete(`/inventory/${item.sku}`)));
      } else {
        await api.delete(`/inventory/${id}`);
      }
      setDeleteConfirmId(null);
      fetchInventory();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title/Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-semibold">Track stock movements, valuation, and warehouses across your enterprise</p>
        </div>

        {/* Audit controls */}
        <div className="flex items-center gap-2">
          {/* Valuation Report */}
          <button
            onClick={() => setIsValuationOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Valuation Report</span>
          </button>

          {/* Audit Stock */}
          <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Audit Stock</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Inventory Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inventory Value</p>
            <p className="text-2xl font-black text-[#1e293b]">₹{totalInventoryValue.toLocaleString('en-IN')}</p>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +2.4% from last month
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Total Items in Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Items in Stock</p>
            <p className="text-2xl font-black text-[#1e293b]">{totalItemsInStock.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-450 font-bold mt-1.5">Across {uniqueWarehouses.length - 1} Warehouses</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</p>
            <p className="text-2xl font-black text-rose-600">{lowStockAlerts} Items</p>
            <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
              Require immediate restock
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Dead Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dead Stock Items</p>
            <p className="text-2xl font-black text-slate-700">{deadStockItems} Items</p>
            <p className="text-[10px] text-slate-450 font-bold mt-1.5">No movement in 90 days</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {inventory.some(item => item.quantity < 10 && item.quantity > 0) && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-rose-800 tracking-tight">Attention: Low Stock Alert!</h3>
              <p className="text-xs text-rose-600/80 mt-0.5 font-medium mb-3">
                The following items have dropped below 10 units and require immediate restocking.
              </p>
              <div className="flex flex-wrap gap-2">
                {inventory.filter(item => item.quantity < 10 && item.quantity > 0).map(item => (
                  <div key={item.sku} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-100 rounded-lg shadow-sm">
                    <span className="text-[11px] font-bold text-slate-700">{item.name} {item.variant ? `(${item.variant})` : ''}</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Row Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Side Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search SKU/Product */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU or Product Name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>

          {/* Warehouse Dropdown */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
          >
            {uniqueWarehouses.map(wh => (
              <option key={wh} value={wh}>{wh === 'All' ? 'All Warehouses' : wh}</option>
            ))}
          </select>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Sync Status Message */}
          {syncMsg && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold animate-fade-in">
              ✓ {syncMsg}
            </span>
          )}

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-550" />
            <span>Export</span>
          </button>

          {/* Sync Products Button (replaces Add Item) */}
          <button
            onClick={syncAndRefresh}
            disabled={syncing}
            className={`flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10 ${syncing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-4 h-4" />
            <span>{syncing ? 'Syncing...' : 'Sync Products'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">SKU</th>
                <th className="py-3.5 px-6">Product Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Warehouse</th>
                <th className="py-3.5 px-6">Quantity</th>
                <th className="py-3.5 px-6">Total Value</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right pr-6 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750 font-semibold">
              {(() => {
                if (filteredInventory.length === 0) {
                  return (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 italic">
                        No matching stock items found
                      </td>
                    </tr>
                  );
                }

                // ── Group by product NAME so all variants appear under ONE product row ──
                const grouped = {};
                filteredInventory.forEach(item => {
                  const key = item.name; // Use product name as the group key
                  if (!grouped[key]) {
                    grouped[key] = {
                      groupKey: key,
                      baseSku: item.baseSku || item.sku,
                      name: item.name,
                      category: item.category,
                      warehouse: item.warehouse,
                      totalQuantity: 0,
                      totalValue: 0,
                      mainItem: null,     // inventory item with NO variant (the plain product entry)
                      variantItems: []    // inventory items WITH a variant set
                    };
                  }
                  grouped[key].totalQuantity += item.quantity;
                  grouped[key].totalValue += (item.quantity * item.unitPrice);

                  if (item.variant && item.variant.trim() !== '') {
                    grouped[key].variantItems.push(item);
                  } else {
                    // If multiple "main" items with same name exist, use the first one
                    if (!grouped[key].mainItem) {
                      grouped[key].mainItem = item;
                    }
                  }
                });

                return Object.values(grouped).map((group) => {
                  const hasVariants = group.variantItems.length > 0;
                  const isExpanded = expandedProducts[group.groupKey];
                  const editTarget = group.mainItem || group.variantItems[0]; // item to edit for main row
                  
                  let groupStatus = 'In Stock';
                  if (group.totalQuantity === 0) groupStatus = 'Out of Stock';
                  else if (group.totalQuantity < 10) groupStatus = 'Low Stock';

                  const statusColors = (s) => ({
                    'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    'Low Stock': 'bg-amber-50 text-amber-700 border-amber-100',
                    'Out of Stock': 'bg-rose-50 text-rose-700 border-rose-100',
                    'Dead Stock': 'bg-slate-50 text-slate-600 border-slate-200',
                  }[s] || 'bg-slate-50 text-slate-600 border-slate-200');

                  // For delete: single item or group of all variants by name
                  const deleteId = hasVariants
                    ? `name:${group.name}` // delete ALL items with this product name
                    : (editTarget ? editTarget.sku : null);

                  return (
                    <React.Fragment key={group.groupKey}>
                      {/* ═══ MAIN PRODUCT ROW ═══ */}
                      <tr className={`hover:bg-slate-50/40 transition-colors ${isExpanded ? 'bg-emerald-50/20' : 'bg-white'}`}>
                        {/* SKU */}
                        <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px] align-top">
                          {group.baseSku}
                        </td>

                        {/* Product Name + Variants toggle button */}
                        <td className="py-3.5 px-6 align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="text-[#1e293b] font-bold text-sm">{group.name}</span>
                            </div>

                            {/* Variants dropdown toggle — ONLY shown if product has variant items */}
                            {hasVariants && (
                              <button
                                onClick={() => toggleExpand(group.groupKey)}
                                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border w-fit transition-all cursor-pointer ${
                                  isExpanded
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                <Tag className="w-3 h-3" />
                                Variants ({group.variantItems.length})
                                {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-6 text-slate-500 align-top">{group.category}</td>

                        {/* Warehouse */}
                        <td className="py-3.5 px-6 text-slate-500 font-medium align-top">
                          {hasVariants ? <span className="text-slate-400 italic text-xs">Multiple</span> : group.warehouse}
                        </td>

                        {/* Total Quantity */}
                        <td className="py-3.5 px-6 text-slate-800 font-extrabold text-sm align-top">
                          {group.totalQuantity}
                          {hasVariants && <span className="text-slate-400 font-normal text-[10px] block">total</span>}
                        </td>

                        {/* Total Value */}
                        <td className="py-3.5 px-6 text-[#1e293b] font-extrabold align-top">
                          ₹{group.totalValue.toLocaleString('en-IN')}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 align-top">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wide border ${statusColors(groupStatus)}`}>
                            {groupStatus}
                          </span>
                        </td>

                        {/* Actions — ALWAYS on main row */}
                        <td className="py-3.5 px-6 text-right pr-6 align-top">
                          {editTarget && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(editTarget)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteId && setDeleteConfirmId(deleteId)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title={hasVariants ? 'Delete All' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* ═══ VARIANT ROWS (expanded dropdown) ═══ */}
                      {isExpanded && hasVariants && (
                        <>
                          {/* Variant header banner */}
                          <tr className="bg-emerald-50/50">
                            <td colSpan="8" className="px-6 py-1.5 border-t border-emerald-100">
                              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">
                                ▾ Variants of {group.name}
                              </span>
                            </td>
                          </tr>

                          {/* One row per variant */}
                          {group.variantItems.map((vItem, vi) => (
                            <tr
                              key={vItem.sku}
                              className={`bg-slate-50/50 hover:bg-emerald-50/20 transition-colors ${
                                vi < group.variantItems.length - 1 ? 'border-b border-slate-100' : 'border-b-2 border-emerald-100'
                              }`}
                            >
                              {/* Variant SKU */}
                              <td className="py-2.5 pl-10 pr-4 text-slate-400 font-mono text-[10px]">
                                └ {vItem.sku}
                              </td>

                              {/* Variant label pill */}
                              <td className="py-2.5 px-6">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm">
                                  <Tag className="w-3 h-3 text-emerald-500" />
                                  {vItem.variant}
                                </span>
                              </td>

                              <td className="py-2.5 px-6 text-slate-400 text-xs">{group.category}</td>
                              <td className="py-2.5 px-6 text-slate-500 text-xs">{vItem.warehouse}</td>

                              {/* Variant Qty */}
                              <td className="py-2.5 px-6 text-slate-800 font-bold text-sm">{vItem.quantity}</td>

                              {/* Variant Value */}
                              <td className="py-2.5 px-6 text-slate-700 font-bold text-xs">
                                ₹{(vItem.quantity * vItem.unitPrice).toLocaleString('en-IN')}
                              </td>

                              {/* Variant Status */}
                              <td className="py-2.5 px-6">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${statusColors(vItem.status)}`}>
                                  {vItem.status}
                                </span>
                              </td>

                              {/* Variant Actions — Edit + Delete */}
                              <td className="py-2.5 px-6 text-right pr-6">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => openEditModal(vItem)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                    title="Edit Variant Stock"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(vItem.sku)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                    title="Delete Variant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inventory Item Portal Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full my-8 overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {modalType === 'add' ? 'Add New Stock Item' : 'Edit Stock Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Selection */}
                {modalType === 'add' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Product *</label>
                    <select
                      required
                      value={itemForm.baseSku}
                      onChange={(e) => {
                        const prod = products.find(p => p.sku === e.target.value);
                        if (prod) {
                          setItemForm({
                            ...itemForm,
                            baseSku: prod.sku,
                            sku: prod.sku,
                            name: prod.name,
                            category: prod.category || 'Necklaces',
                            unitPrice: prod.retailPrice || 0,
                            variant: ''
                          });
                          if (prod.variants && prod.variants.length > 0) {
                            const initialVq = {};
                            prod.variants.forEach(vg => {
                              vg.options.forEach(opt => {
                                initialVq[`${vg.group}: ${opt}`] = '';
                              });
                            });
                            setVariantQuantities(initialVq);
                          } else {
                            setVariantQuantities({});
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose a Product --</option>
                      {products.map(p => (
                        <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Variant & Quantity Bulk Selection */}
                {modalType === 'add' && itemForm.baseSku && (() => {
                  const prod = products.find(p => p.sku === itemForm.baseSku);
                  if (prod && prod.variants && prod.variants.length > 0) {
                    return (
                      <div className="space-y-3 sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Set Quantities for Variants</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {prod.variants.map((vGroup) => (
                            vGroup.options.map((opt) => {
                              const variantName = `${vGroup.group}: ${opt}`;
                              return (
                                <div key={variantName} className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                                  <span className="text-xs font-bold text-slate-700">{variantName}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Qty"
                                    value={variantQuantities[variantName] !== undefined ? variantQuantities[variantName] : ''}
                                    onChange={(e) => setVariantQuantities({ ...variantQuantities, [variantName]: e.target.value })}
                                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-center focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              );
                            })
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Single Item Details (Hidden if using bulk variants) */}
                {!(modalType === 'add' && Object.keys(variantQuantities).length > 0) && (
                  <>
                    {/* Variant Selection (For Editing) */}
                    {modalType === 'edit' && (() => {
                      const prod = products.find(p => p.sku === itemForm.baseSku) || products.find(p => p.sku === itemForm.sku);
                      if (!prod || !prod.variants || prod.variants.length === 0) return null;
                      return (
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Variant *</label>
                          <select
                            required
                            value={itemForm.variant}
                            onChange={(e) => {
                               const v = e.target.value;
                               const cleanV = v.replace(/[^a-zA-Z0-9]/g, '');
                               setItemForm({ ...itemForm, variant: v, sku: `${itemForm.baseSku || itemForm.sku}-${cleanV}` });
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Choose a Variant --</option>
                            {prod.variants.map((vGroup) => (
                               vGroup.options.map((opt) => (
                                 <option key={`${vGroup.group}-${opt}`} value={`${vGroup.group}: ${opt}`}>{vGroup.group}: {opt}</option>
                               ))
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* SKU Code */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory SKU *</label>
                      <input
                        type="text"
                        required
                        disabled={modalType === 'edit'}
                        value={itemForm.sku}
                        onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                        placeholder="e.g. SKU-1007"
                        className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'edit' ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                          }`}
                      />
                    </div>
                  </>
                )}

                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Diamond Studs"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Necklaces">Necklaces</option>
                    <option value="Bangles">Bangles</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Rings">Rings</option>
                  </select>
                </div>

                {/* Warehouse Location */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warehouse Location *</label>
                  <select
                    value={itemForm.warehouse}
                    onChange={(e) => setItemForm({ ...itemForm, warehouse: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Main WH - A1">Main WH - A1</option>
                    <option value="Main WH - B2">Main WH - B2</option>
                    <option value="Retail Store">Retail Store</option>
                  </select>
                </div>

                {/* Single Quantity (Hidden if bulk) */}
                {!(modalType === 'add' && Object.keys(variantQuantities).length > 0) && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                {/* Unit Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={itemForm.unitPrice}
                    onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Status *</label>
                  <select
                    value={itemForm.status}
                    onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="In Stock">In Stock (Qty &gt; 15)</option>
                    <option value="Low Stock">Low Stock (Qty &lt;= 15)</option>
                    <option value="Out of Stock">Out of Stock (Qty = 0)</option>
                    <option value="Dead Stock">Dead Stock (Static No Movement)</option>
                  </select>
                </div>
              </div>

              {/* Total Computed Value row */}
              <div className="pt-1.5">
                <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide">Dynamic Valuation: </span>
                <span className="text-sm font-black text-emerald-700 ml-1">
                  ₹{((parseInt(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-500/15"
                >
                  {modalType === 'add' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Portal Dialog */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-extrabold text-slate-800 text-base">
                {(deleteConfirmId.startsWith('group-') || deleteConfirmId.startsWith('name:')) ? 'Delete All Variants' : 'Delete Stock Entry'}
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {(deleteConfirmId.startsWith('group-') || deleteConfirmId.startsWith('name:'))
                ? 'This will permanently delete ALL variant entries for this product from inventory. This action cannot be undone.'
                : 'Are you sure you want to delete this stock entry? This will permanently erase SKU details, count records, and valuation data.'}
            </p>

            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-rose-500/15"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Valuation Report Portal Modal */}
      {isValuationOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600">
                <BarChart3 className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 text-base">Warehouse Valuation Analysis</h3>
              </div>
              <button
                onClick={() => setIsValuationOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Valuation Table */}
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Summary valuation metrics grouped by warehouse facilities. Calculations reflect current stock counts multiplied by unit prices.
              </p>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-250/30 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Warehouse</th>
                      <th className="py-3 px-4 text-center">SKU Groups</th>
                      <th className="py-3 px-4 text-right">Items Count</th>
                      <th className="py-3 px-4 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {uniqueWarehouses.filter(w => w !== 'All').map(wh => {
                      const whItems = inventory.filter(i => i.warehouse === wh);
                      const skusCount = whItems.length;
                      const itemsCount = whItems.reduce((s, i) => s + i.quantity, 0);
                      const totalVal = whItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

                      return (
                        <tr key={wh} className="hover:bg-white/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800">{wh}</td>
                          <td className="py-3 px-4 text-center text-slate-500">{skusCount}</td>
                          <td className="py-3 px-4 text-right text-slate-900">{itemsCount}</td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-extrabold">₹{totalVal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100/40 font-bold border-t border-slate-200">
                      <td className="py-3 px-4 text-slate-800">Grand Total</td>
                      <td className="py-3 px-4 text-center text-slate-500">{inventory.length}</td>
                      <td className="py-3 px-4 text-right text-slate-900">{totalItemsInStock}</td>
                      <td className="py-3 px-4 text-right text-emerald-800 font-black">₹{totalInventoryValue.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsValuationOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Audit Stock Portal Modal */}
      {isAuditOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600">
                <ClipboardCheck className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 text-base">Physical Inventory Audit Sheet</h3>
              </div>
              <button
                onClick={() => setIsAuditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Use this formatted audit sheet for manual physical stock counts and reconciliation verification. You can trigger a print dialog using your browser commands.
              </p>

              <div className="border border-slate-200 rounded-2xl overflow-hidden p-4 bg-slate-50/20 space-y-4">
                <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-3 font-semibold text-slate-500">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">GreenAdmin Enterprises</p>
                    <p className="mt-0.5">Physical Audit Log sheet</p>
                  </div>
                  <div className="text-right">
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p className="mt-0.5">Audited By: ________________</p>
                  </div>
                </div>

                <table className="w-full text-left text-[11px] font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-450 uppercase pb-2">
                      <th className="py-2 px-1">SKU</th>
                      <th className="py-2 px-1">Product Name</th>
                      <th className="py-2 px-1">Warehouse</th>
                      <th className="py-2 px-1 text-right">Expected Qty</th>
                      <th className="py-2 px-1 text-right w-28">Physical Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map(item => (
                      <tr key={item.sku} className="py-2">
                        <td className="py-2.5 px-1 font-mono text-[10.5px] text-slate-450">{item.sku}</td>
                        <td className="py-2.5 px-1 text-slate-800 font-bold">{item.name}</td>
                        <td className="py-2.5 px-1 text-slate-500">{item.warehouse}</td>
                        <td className="py-2.5 px-1 text-right text-slate-900 font-bold pr-2">{item.quantity}</td>
                        <td className="py-2.5 px-1 text-right text-slate-300 font-light pr-2"> [ &nbsp; &nbsp; &nbsp; &nbsp; ] </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                onClick={() => setIsAuditOpen(false)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Print Sheet
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Inventory;
