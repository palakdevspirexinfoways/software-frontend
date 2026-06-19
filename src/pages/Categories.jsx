import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronsUpDown,
  FolderOpen,
  AlertCircle,
  Check
} from 'lucide-react';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Form State
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    status: 'Active'
  });

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get('/categories');
      if (Array.isArray(data)) {
        setCategories(data.map(c => ({ ...c, id: c._id })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Table Row Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCategories(filteredCategories.map(c => c.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (id) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(cId => cId !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  // Search Filter
  const filteredCategories = categories.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term);
  });

  // Pagination Logic
  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));

  // Reset page index if filters exceed the page range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredCategories.length, totalPages, currentPage]);

  // Open Modal Helper
  const openAddModal = () => {
    setCategoryForm({
      id: null,
      name: '',
      status: 'Active'
    });
    setModalType('add');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      status: category.status
    });
    setModalType('edit');
    setIsModalOpen(true);
  };



  // Handle Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      const payload = {
        name: categoryForm.name.trim(),
        status: categoryForm.status
      };

      if (modalType === 'add') {
        await api.post('/categories', payload);
      } else {
        await api.put(`/categories/${categoryForm.id}`, payload);
      }
      fetchCategories();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Handle Delete
  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setSelectedCategories(selectedCategories.filter(cId => cId !== id));
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Inline Status Toggle
  const handleStatusToggle = async (id) => {
    const categoryToToggle = categories.find(c => c.id === id);
    if (!categoryToToggle) return;

    try {
      const newStatus = categoryToToggle.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/categories/${id}`, {
        status: newStatus
      });
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title/Sub Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Product Management</h1>
        <p className="text-sm text-slate-500 mt-1 font-semibold">Manage your entire catalog, categories, and inventory items.</p>
      </div>

      {/* Section Header Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1e293b]">Categories & Sub-Categories</h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">Manage your product categories and their sub-categories in one place.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Category Button */}
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
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
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-450 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCategories.length > 0 && selectedCategories.length === filteredCategories.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>CATEGORY NAME</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>


                <th className="py-3.5 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer select-none">
                    <span>STATUS</span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right pr-6 w-24">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {currentCategories.length > 0 ? (
                currentCategories.map((category) => (
                  <tr
                    key={category.id}
                    className={`hover:bg-slate-50/30 transition-colors ${selectedCategories.includes(category.id) ? 'bg-slate-50/50' : ''
                      }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleSelectCategory(category.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Category Name */}
                    <td className="py-3.5 px-4 text-[#1e293b] font-bold text-sm">
                      {category.name}
                    </td>





                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleStatusToggle(category.id)}
                        className={`flex items-center space-x-1.5 transition-all text-left group`}
                        title="Click to toggle status"
                      >
                        <span className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${category.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}></span>
                        <span className={`text-xs font-bold transition-colors ${category.status === 'Active' ? 'text-emerald-700 hover:text-emerald-800' : 'text-rose-700 hover:text-rose-800'
                          }`}>
                          {category.status}
                        </span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(category.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 italic">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 font-semibold">
          <div className="text-xs text-slate-400">
            Showing {filteredCategories.length > 0 ? indexOfFirstCategory + 1 : 0} to {Math.min(indexOfLastCategory, filteredCategories.length)} of {filteredCategories.length} entries
          </div>

          <div className="flex items-center space-x-1">
            {/* Prev Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 transition-colors cursor-pointer select-none ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                }`}
            >
              Prev
            </button>

            {/* Pages list */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer select-none flex items-center justify-center ${currentPage === pageNum
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {pageNum}
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

      {/* Add / Edit Category Modal (Rendered via portal) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full my-8 overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {modalType === 'add' ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Necklaces"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
              </div>



              {/* Status Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status *</label>
                <select
                  value={categoryForm.status}
                  onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-500/15"
                >
                  {modalType === 'add' ? 'Add Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog (Rendered via portal for consistent styling) */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-extrabold text-slate-800 text-base">Delete Category</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>

            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-rose-500/15"
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

export default Categories;
