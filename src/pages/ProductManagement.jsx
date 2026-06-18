import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    variants: [{ group: '', options: '' }],
    variantDetails: [],
    unit: 'Pcs',
    sku: '',
    vendor: '',
    qty: 0,
    wholesalePrice: '',
    retailPrice: '',
    status: 'Active',
    image: ''
  });

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
      // In view/edit mode, variants might be strings or arrays depending on if they were just typed
      const processVariants = (vars) => {
        return vars.filter(v => v.group && v.group.trim()).map(v => {
          let optionsArr = [];
          if (Array.isArray(v.options)) {
            optionsArr = v.options;
          } else if (typeof v.options === 'string') {
            optionsArr = v.options.split(',').map(opt => opt.trim()).filter(opt => opt);
          }
          return {
            group: v.group.trim(),
            options: optionsArr
          };
        });
      };

      const productData = {
        name: newProduct.name,
        image: newProduct.image || 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&auto=format&fit=crop&q=60',
        category: newProduct.category,
        variants: processVariants(newProduct.variants),
        variantDetails: newProduct.variantDetails || [],
        unit: newProduct.unit,
        sku: newProduct.sku,
        vendor: newProduct.vendor,
        qty: (newProduct.variantDetails && newProduct.variantDetails.length > 0)
          ? newProduct.variantDetails.reduce((sum, v) => sum + (parseInt(v.qty) || 0), 0)
          : parseInt(newProduct.qty) || 0,
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || 0,
        retailPrice: parseFloat(newProduct.retailPrice) || 0,
        status: newProduct.status
      };

      if (modalType === 'add') {
        await api.post('/products', productData);
      } else if (modalType === 'edit') {
        await api.put(`/products/${newProduct._id || newProduct.id}`, productData);
      }
      
      fetchProducts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} product:`, error);
      alert(error.response?.data?.message || 'Error saving product');
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      category: '',
      variants: [{ group: '', options: '' }],
      variantDetails: [],
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
      variants: product.variants && product.variants.length > 0 ? product.variants.map(v => ({
        group: v.group,
        options: Array.isArray(v.options) ? v.options.join(', ') : v.options
      })) : [{ group: '', options: '' }],
      variantDetails: product.variantDetails || []
    });
    setModalType(type); // 'edit' or 'view'
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Error deleting product');
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
        `"${(p.variants || []).map(v => `${v.group}: ${v.options.join(', ')}`).join(' | ')}"`,
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
  };

  // Filter products by search term
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.variants || []).some(v => v.group.toLowerCase().includes(term) || v.options.some(opt => opt.toLowerCase().includes(term))) ||
      p.sku.toLowerCase().includes(term) ||
      p.vendor.toLowerCase().includes(term)
    );
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title/Sub Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Product Management</h1>
        <p className="text-sm text-slate-500 mt-1 font-semibold">Manage your entire catalog, categories, and inventory items.</p>
      </div>

      {/* Controls / Filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1e293b]">All Products</h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">Manage your entire product catalog.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Variant View */}
          <button className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <Tag className="w-3.5 h-3.5 rotate-90 text-slate-500" />
            <span>Variant View</span>
          </button>

          {/* Filter */}
          <button className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          {/* Add Product */}
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Inner Controls */}
        <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
          {/* Left Search input */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          {/* Right View button */}
          <button className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <Eye className="w-3.5 h-3.5 text-slate-550" />
            <span>View</span>
          </button>
        </div>

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
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
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
                      {product.variants && product.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.variants.map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
                              {v.group}: {v.options ? v.options.join(', ') : ''}
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
          <div className="text-xs text-slate-500 font-bold">
            Showing {filteredProducts.length > 0 ? indexOfFirstProduct + 1 : 0} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} entries
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

                {/* Variants */}
                <div className="space-y-3 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Variants</label>
                    {modalType !== 'view' && (
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, variants: [...newProduct.variants, { group: '', options: '' }] })}
                        className="text-xs text-emerald-600 font-bold hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> <span>Add Variant</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {newProduct.variants.map((variant, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input
                          type="text"
                          disabled={modalType === 'view'}
                          value={variant.group}
                          onChange={(e) => {
                            const newVariants = [...newProduct.variants];
                            newVariants[index].group = e.target.value;
                            setNewProduct({ ...newProduct, variants: newVariants });
                          }}
                          placeholder="e.g. Size"
                          className={`w-full sm:w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 ${modalType === 'view' ? 'bg-slate-100' : ''}`}
                        />
                        <input
                          type="text"
                          disabled={modalType === 'view'}
                          value={variant.options}
                          onChange={(e) => {
                            const newVariants = [...newProduct.variants];
                            newVariants[index].options = e.target.value;
                            setNewProduct({ ...newProduct, variants: newVariants });
                          }}
                          placeholder="e.g. S, M, L (comma separated)"
                          className={`w-full flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 ${modalType === 'view' ? 'bg-slate-100' : ''}`}
                        />
                        {newProduct.variants.length > 1 && modalType !== 'view' && (
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = newProduct.variants.filter((_, i) => i !== index);
                              setNewProduct({ ...newProduct, variants: newVariants });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variant Combinations Table */}
                {newProduct.variants.some(v => v.group.trim() && v.options.length > 0) && (
                  <div className="space-y-3 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variant Stock & Pricing</label>
                      {modalType !== 'view' && (
                        <button
                          type="button"
                          onClick={() => {
                            const parsedVariants = newProduct.variants.filter(v => v.group.trim()).map(v => ({
                              group: v.group.trim(),
                              options: typeof v.options === 'string' ? v.options.split(',').map(o => o.trim()).filter(o => o) : v.options
                            }));
                            const validGroups = parsedVariants.filter(g => g.group.trim() && g.options.length > 0);
                            if (validGroups.length === 0) return;
                            let combos = [[]];
                            for (const vg of validGroups) {
                              const nextCombos = [];
                              for (const combo of combos) {
                                for (const opt of vg.options) {
                                  nextCombos.push([...combo, { group: vg.group, option: opt }]);
                                }
                              }
                              combos = nextCombos;
                            }
                            const comboStrings = combos.map(combo => combo.map(c => `${c.group}: ${c.option}`).join(' | '));
                            const newDetails = comboStrings.map(comboStr => {
                              const existing = (newProduct.variantDetails || []).find(vd => vd.variantName === comboStr);
                              if (existing) return existing;
                              return {
                                variantName: comboStr,
                                sku: `${newProduct.sku || 'SKU'}-${comboStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6)}`,
                                qty: 0,
                                retailPrice: newProduct.retailPrice || 0,
                                wholesalePrice: newProduct.wholesalePrice || 0
                              };
                            });
                            setNewProduct({ ...newProduct, variantDetails: newDetails });
                          }}
                          className="text-xs text-emerald-600 font-bold hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> <span>Generate Combinations</span>
                        </button>
                      )}
                    </div>
                    
                    {newProduct.variantDetails && newProduct.variantDetails.length > 0 && (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs bg-white">
                          <thead>
                            <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                              <th className="py-2 px-3">Variant</th>
                              <th className="py-2 px-3">SKU</th>
                              <th className="py-2 px-3 w-20">Qty</th>
                              <th className="py-2 px-3 w-24">Retail (₹)</th>
                              <th className="py-2 px-3 w-24">Wholesale (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {newProduct.variantDetails.map((vd, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-semibold text-slate-700">{vd.variantName}</td>
                                <td className="py-2 px-3">
                                  <input 
                                    type="text" 
                                    value={vd.sku} 
                                    disabled={modalType === 'view'}
                                    onChange={(e) => {
                                      const nd = [...newProduct.variantDetails];
                                      nd[idx].sku = e.target.value;
                                      setNewProduct({...newProduct, variantDetails: nd});
                                    }}
                                    className={`w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500 ${modalType === 'view' ? 'bg-slate-50' : ''}`}
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input 
                                    type="number" 
                                    value={vd.qty} 
                                    disabled={modalType === 'view'}
                                    onChange={(e) => {
                                      const nd = [...newProduct.variantDetails];
                                      nd[idx].qty = parseInt(e.target.value) || 0;
                                      setNewProduct({...newProduct, variantDetails: nd});
                                    }}
                                    className={`w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500 ${modalType === 'view' ? 'bg-slate-50' : ''}`}
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input 
                                    type="number" 
                                    value={vd.retailPrice} 
                                    disabled={modalType === 'view'}
                                    onChange={(e) => {
                                      const nd = [...newProduct.variantDetails];
                                      nd[idx].retailPrice = parseFloat(e.target.value) || 0;
                                      setNewProduct({...newProduct, variantDetails: nd});
                                    }}
                                    className={`w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500 ${modalType === 'view' ? 'bg-slate-50' : ''}`}
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input 
                                    type="number" 
                                    value={vd.wholesalePrice} 
                                    disabled={modalType === 'view'}
                                    onChange={(e) => {
                                      const nd = [...newProduct.variantDetails];
                                      nd[idx].wholesalePrice = parseFloat(e.target.value) || 0;
                                      setNewProduct({...newProduct, variantDetails: nd});
                                    }}
                                    className={`w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500 ${modalType === 'view' ? 'bg-slate-50' : ''}`}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={modalType === 'view' || (newProduct.variantDetails && newProduct.variantDetails.length > 0)}
                    value={
                      (newProduct.variantDetails && newProduct.variantDetails.length > 0)
                        ? newProduct.variantDetails.reduce((sum, v) => sum + (parseInt(v.qty) || 0), 0)
                        : newProduct.qty
                    }
                    onChange={(e) => setNewProduct({ ...newProduct, qty: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${modalType === 'view' || (newProduct.variantDetails && newProduct.variantDetails.length > 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                  {newProduct.variantDetails && newProduct.variantDetails.length > 0 && (
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">Calculated from variants</span>
                  )}
                </div>

                {/* Wholesale Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    disabled={modalType === 'view'}
                    value={newProduct.wholesalePrice}
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
                    value={newProduct.retailPrice}
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
    </div>
  );
};

export default ProductManagement;
