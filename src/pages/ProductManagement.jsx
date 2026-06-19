import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../components/Toast';
import { api, BASE_URL } from '../services/api';
import {
  Tag,
  Filter,
  Download,
  Plus,
  Search,
  Eye,
  X,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Package2,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const ProductManagement = () => {
  const { showToast, ToastContainer } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    sku: '',
    category: '',
    status: ''
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewImageUrl, setViewImageUrl] = useState(null);

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({
    productId: '',
    variantName: '',
    sku: '',
    qty: 0,
    retailPrice: '',
    wholesalePrice: '',
    image: ''
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    unit: 'Pcs',
    sku: '',
    vendor: '',
    qty: 0,
    wholesalePrice: '',
    retailPrice: '',
    status: 'Active',
    image: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState('url'); // 'url' or 'upload'
  const [bulkImageInputMode, setBulkImageInputMode] = useState('url'); // 'url' | 'upload'

  const preventInvalidNumberInput = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const data = await api.post('/upload', formData);
      setNewProduct({ ...newProduct, image: data.imageUrl });
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error uploading image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVariantImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const data = await api.post('/upload', formData);
      setNewVariant({ ...newVariant, image: data.imageUrl });
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error uploading image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/products');
      if (Array.isArray(data)) {
        setProducts(data.map(p => ({ ...p, id: p._id })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/categories');
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle product selections
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pId => pId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  // Change product status inline
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/products/${id}`, { status: newStatus });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  // Handle Add/Edit Product Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (modalType === 'view') return;

    try {
      const productData = {
        name: newProduct.name,
        image: newProduct.image,
        category: newProduct.category,
        unit: newProduct.unit,
        sku: newProduct.sku,
        vendor: newProduct.vendor,
        qty: parseInt(newProduct.qty) || 0,
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || 0,
        retailPrice: parseFloat(newProduct.retailPrice) || 0,
        status: newProduct.status
      };

      if (modalType === 'add') {
        await api.post('/products', productData);
        showToast('Product added successfully!', 'success');
      } else if (modalType === 'edit') {
        await api.put(`/products/${newProduct._id || newProduct.id}`, productData);
        showToast('Product updated successfully!', 'success');
      }
      
      fetchProducts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} product:`, error);
      showToast(error.response?.data?.message || 'Error saving product', 'error');
    }
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${newVariant.productId}/variants`, {
        ...newVariant,
        qty: parseInt(newVariant.qty) || 0,
        retailPrice: parseFloat(newVariant.retailPrice) || 0,
        wholesalePrice: parseFloat(newVariant.wholesalePrice) || 0
      });
      showToast('Variant added successfully!', 'success');
      fetchProducts();
      setIsVariantModalOpen(false);
      setNewVariant({
        productId: '',
        variantName: '',
        sku: '',
        qty: 0,
        retailPrice: '',
        wholesalePrice: '',
        image: ''
      });
    } catch (error) {
      console.error('Error adding variant:', error);
      showToast(error.response?.data?.message || 'Error adding variant', 'error');
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      category: '',
      unit: 'Pcs',
      sku: '',
      vendor: '',
      qty: 0,
      wholesalePrice: '',
      retailPrice: '',
      status: 'Active',
      image: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setModalType('add');
    setIsModalOpen(true);
  };

  const openEditModal = (product, type) => {
    setNewProduct({
      ...product,
      id: product.id,
      _id: product._id || product.id,
    });
    setModalType(type); // 'edit' or 'view'
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirmId(null);
      fetchProducts();
      showToast('Product deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(error.response?.data?.message || 'Error deleting product', 'error');
    }
  };

  // Export CSV function
  const exportToCSV = () => {
    const csvRows = [];
    const headers = ['NAME', 'CATEGORY', 'VARIANTS', 'UNIT', 'SKU BARCODE', 'VENDOR', 'QTY', 'WHOLESALE PRICE', 'RETAIL PRICE', 'CREATED AT', 'STATUS'];
    csvRows.push(headers.join(','));

    products.forEach(p => {
      const values = [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        `"${(p.variantDetails || []).map(v => v.variantName).join(' | ')}"`,
        `"${p.unit}"`,
        `"${p.sku}"`,
        `"${p.vendor}"`,
        p.qty,
        p.wholesalePrice,
        p.retailPrice,
        p.createdAt,
        `"${p.status}"`
      ];
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export successful!', 'success');
  };

  // Filter products by search term and filters
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || (
      (p.name || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.variants || []).some(v => (v.group || '').toLowerCase().includes(term) || (v.options || []).some(opt => (opt || '').toLowerCase().includes(term))) ||
      (p.variantDetails || []).some(vd => (vd.variantName || '').toLowerCase().includes(term) || (vd.sku || '').toLowerCase().includes(term)) ||
      (p.sku || '').toLowerCase().includes(term) ||
      (p.vendor || '').toLowerCase().includes(term)
    );
    const matchesName = !filters.name || (p.name || '').toLowerCase().includes(filters.name.toLowerCase());
    const matchesSku = !filters.sku || (p.sku || '').toLowerCase().includes(filters.sku.toLowerCase());
    const matchesCategory = !filters.category || p.category === filters.category;
    const matchesStatus = !filters.status || p.status === filters.status;

    return matchesSearch && matchesName && matchesSku && matchesCategory && matchesStatus;
  });

  // Pagination Logic
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  // If page index is higher than actual page limits (e.g. after deletion/filtering), reset it
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, totalPages, currentPage]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      <ToastContainer />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Product Management</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage your entire catalog, categories, and inventory items</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsVariantModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
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
              placeholder="Search by product name, SKU, vendor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={filters.name}
                onChange={e => {
                  setFilters(f => ({ ...f, name: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Barcode</label>
              <input
                type="text"
                placeholder="Filter by SKU..."
                value={filters.sku}
                onChange={e => {
                  setFilters(f => ({ ...f, sku: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <select
                value={filters.category}
                onChange={e => {
                  setFilters(f => ({ ...f, category: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
              <select
                value={filters.status}
                onChange={e => {
                  setFilters(f => ({ ...f, status: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {(filters.name || filters.sku || filters.category || filters.status) && (
              <div className="col-span-2 sm:col-span-4 flex justify-end mt-1">
                <button
                  onClick={() => {
                    setFilters({ name: '', sku: '', category: '', status: '' });
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>IMAGE</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>NAME</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>CATEGORY</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>VARIANTS</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>UNIT</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>SKU BARCODE</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>QTY</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>STATUS</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right pr-6 w-24">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50/30 transition-colors ${selectedProducts.includes(product.id) ? 'bg-slate-50/50' : ''
                      }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Image */}
                    <td className="py-3.5 px-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center bg-slate-50">
                        {product.image ? (
                          <img
                            src={product.image.startsWith('/') ? `${BASE_URL}${product.image}` : product.image}
                            alt={product.name}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewImageUrl(product.image.startsWith('/') ? `${BASE_URL}${product.image}` : product.image)}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package2 className="w-5 h-5 text-slate-350" />
                        )}
                      </div>
                    </td>

                    {/* Name Link */}
                    <td className="py-3.5 px-4">
                      <button className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all text-left">
                        {product.name}
                      </button>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-500 font-semibold text-xs">
                      {product.category || '—'}
                    </td>

                    {/* Variants */}
                    <td className="py-3.5 px-4 text-slate-500 font-semibold text-[11px]">
                      {product.variantDetails && product.variantDetails.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {product.variantDetails.map((v, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
                              {v.image && (
                                <img 
                                  src={v.image.startsWith('/') ? `${BASE_URL}${v.image}` : v.image} 
                                  alt={v.variantName} 
                                  className="w-4 h-4 rounded-sm object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                                  onClick={() => setViewImageUrl(v.image.startsWith('/') ? `${BASE_URL}${v.image}` : v.image)}
                                />
                              )}
                              {v.variantName} (Qty: {v.qty})
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {product.unit}
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {product.sku}
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      {product.qty}
                    </td>

                    {/* Status Dropdown Badges */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block text-left">
                        <select
                          value={product.status}
                          onChange={(e) => handleStatusChange(product.id, e.target.value)}
                          className={`appearance-none px-3 py-1 pr-6 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer focus:outline-none ${product.status === 'Active'
                              ? 'bg-emerald-50 text-[#10b981] border-emerald-100 focus:ring-emerald-500/10'
                              : product.status === 'Out of Stock'
                                ? 'bg-amber-50/80 text-[#f59e0b] border-amber-100 focus:ring-amber-500/10'
                                : 'bg-rose-50 text-[#f43f5e] border-rose-100 focus:ring-rose-500/10'
                            }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Out of Stock">Out of Stock</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown className={`w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${product.status === 'Active'
                            ? 'text-emerald-500'
                            : product.status === 'Out of Stock'
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`} />
                      </div>
                    </td>

                    {/* Actions buttons */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(product, 'view')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="View Product"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(product, 'edit')}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(product.id || product.sku)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="py-8 text-center text-slate-400 font-medium">
                    No products found matching that query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-bold">
              Showing {filteredProducts.length > 0 ? indexOfFirstProduct + 1 : 0} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} entries
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Per Page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-600 text-xs font-bold focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            {/* Prev Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 transition-colors cursor-pointer select-none ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                }`}
            >
              Prev
            </button>

            {/* Page Buttons */}
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all cursor-pointer border ${currentPage === i + 1
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 transition-colors cursor-pointer select-none ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit/View Product Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full my-8 overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {modalType === 'add' ? 'Add New Product' : modalType === 'edit' ? 'Edit Product' : 'View Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Image */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Image</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setImageInputMode('url')} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${imageInputMode === 'url' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>URL</button>
                      <button type="button" onClick={() => setImageInputMode('upload')} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${imageInputMode === 'upload' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Upload</button>
                    </div>
                  </div>
                  {imageInputMode === 'url' ? (
                    <input
                      type="text"
                      disabled={modalType === 'view'}
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      placeholder="e.g. https://example.com/image.jpg"
                      className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={modalType === 'view' || uploadingImage}
                        onChange={handleImageUpload}
                        className={`w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer ${modalType === 'view' || uploadingImage ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                      {uploadingImage && <span className="text-xs text-emerald-600 font-bold animate-pulse">Uploading...</span>}
                    </div>
                  )}
                  {newProduct.image && (
                    <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                      <img src={newProduct.image.startsWith('/') ? `${BASE_URL}${newProduct.image}` : newProduct.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name *</label>
                  <input
                    type="text"
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Bangles Golden White"
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                  <select
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>



                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Barcode *</label>
                  <input
                    type="text"
                    required
                    disabled={modalType === 'view' || modalType === 'edit'}
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="e.g. SKU-1002"
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType !== 'add' ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Vendor */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor *</label>
                  <input
                    type="text"
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.vendor}
                    onChange={(e) => setNewProduct({ ...newProduct, vendor: e.target.value })}
                    placeholder="e.g. ABC Suppliers"
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Initial Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity *</label>
                  <input
                    type="number"
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.qty === 0 ? '' : newProduct.qty}
                    onKeyDown={preventInvalidNumberInput}
                    onChange={(e) => {
                      const newQty = e.target.value;
                      let newStatus = newProduct.status;
                      if (parseInt(newQty) === 0 || newQty === '0') {
                        newStatus = 'Out of Stock';
                      } else if (newStatus === 'Out of Stock') {
                        newStatus = 'Active';
                      }
                      setNewProduct({ ...newProduct, qty: newQty, status: newStatus });
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Wholesale Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.wholesalePrice === 0 ? '' : newProduct.wholesalePrice}
                    onKeyDown={preventInvalidNumberInput}
                    onChange={(e) => setNewProduct({ ...newProduct, wholesalePrice: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Retail Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retail Price (₹) *</label>
                  <input
                    type="number"
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.retailPrice === 0 ? '' : newProduct.retailPrice}
                    onKeyDown={preventInvalidNumberInput}
                    onChange={(e) => setNewProduct({ ...newProduct, retailPrice: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status *</label>
                  <select
                    value={newProduct.status}
                    disabled={modalType === 'view'}
                    onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                    className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Selling Unit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Unit</label>
                  <select
                    value={newProduct.unit}
                    disabled={modalType === 'view'}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer ${modalType === 'view' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Pair">Pair</option>
                    <option value="Box">Box</option>
                    <option value="Set">Set</option>
                    <option value="Gram">Gram</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {modalType === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'view' && (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    {modalType === 'add' ? 'Save Product' : 'Update Product'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Variant Modal */}
      {isVariantModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center space-x-3 text-emerald-600">
                <Plus className="w-6 h-6 flex-shrink-0" />
                <h2 className="text-lg font-extrabold text-slate-800">Add Variant</h2>
              </div>
              <button
                onClick={() => setIsVariantModalOpen(false)}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all cursor-pointer shadow-sm border border-transparent hover:border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleVariantSubmit} className="flex-1 overflow-y-auto overflow-x-hidden p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Select Product */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Product *</label>
                  <select
                    required
                    value={newVariant.productId}
                    onChange={(e) => setNewVariant({ ...newVariant, productId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer transition-all"
                  >
                    <option value="">Select an existing product...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Variant Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variant Name *</label>
                  <input
                    type="text"
                    required
                    value={newVariant.variantName}
                    onChange={(e) => setNewVariant({ ...newVariant, variantName: e.target.value })}
                    placeholder="e.g. Red - Size L"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Barcode *</label>
                  <input
                    type="text"
                    required
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                    placeholder="e.g. SKU-RED-L"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={newVariant.qty === 0 ? '' : newVariant.qty}
                    onKeyDown={preventInvalidNumberInput}
                    onChange={(e) => setNewVariant({ ...newVariant, qty: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Retail Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retail Price (₹)</label>
                  <input
                    type="number"
                    value={newVariant.retailPrice === 0 ? '' : newVariant.retailPrice}
                    onKeyDown={preventInvalidNumberInput}
                    onChange={(e) => setNewVariant({ ...newVariant, retailPrice: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Wholesale Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    value={newVariant.wholesalePrice === 0 ? '' : newVariant.wholesalePrice}
                    onKeyDown={preventInvalidNumberInput}
                    onChange={(e) => setNewVariant({ ...newVariant, wholesalePrice: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Variant Image */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Variant Image</span>
                    <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${imageInputMode === 'url' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'} transition-all`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${imageInputMode === 'upload' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'} transition-all`}
                      >
                        Upload
                      </button>
                    </div>
                  </label>
                  {imageInputMode === 'url' ? (
                    <input
                      type="text"
                      value={newVariant.image}
                      onChange={(e) => setNewVariant({ ...newVariant, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  ) : (
                    <div className="relative w-full border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:bg-slate-100 hover:border-slate-300">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleVariantImageUpload}
                        className={`w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer ${uploadingImage ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                      {uploadingImage && <span className="text-xs text-emerald-600 font-bold animate-pulse mt-2 block">Uploading...</span>}
                    </div>
                  )}
                  {newVariant.image && (
                    <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                      <img src={newVariant.image.startsWith('/') ? `${BASE_URL}${newVariant.image}` : newVariant.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end items-center space-x-3 pt-8 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className={`px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 ${uploadingImage ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Check className="w-4 h-4" /> Save Variant
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
              <h3 className="font-extrabold text-slate-800 text-base">Delete Product</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete this product? This will permanently erase the product and all associated inventory and variant data.
            </p>

            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-rose-500/15"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image View Portal Dialog */}
      {viewImageUrl && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 cursor-pointer"
          onClick={() => setViewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setViewImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 p-2 cursor-pointer bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={viewImageUrl} 
              alt="View" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductManagement;
