import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  Tag,
  Plus,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Search
} from 'lucide-react';

export const Variants = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form states
  const [variantForm, setVariantForm] = useState({
    id: null,
    name: '',
    options: []
  });
  const [optionInput, setOptionInput] = useState('');

  // Fetch variants from backend
  const fetchVariants = async () => {
    try {
      setLoading(true);
      const data = await api.get('/variants');
      if (Array.isArray(data)) {
        setVariants(data.map(v => ({ ...v, id: v._id })));
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  // Filter list
  const filteredVariants = variants.filter(v => {
    const term = searchTerm.toLowerCase();
    return (
      v.name.toLowerCase().includes(term) ||
      (v.options && v.options.some(opt => opt.toLowerCase().includes(term)))
    );
  });

  // Open Create helper
  const openCreateModal = () => {
    setVariantForm({
      id: null,
      name: '',
      options: []
    });
    setOptionInput('');
    setModalType('add');
    setIsModalOpen(true);
  };

  // Open Edit helper
  const openEditModal = (variant) => {
    setVariantForm({
      id: variant.id,
      name: variant.name,
      options: [...variant.options]
    });
    setOptionInput('');
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Add options
  const handleAddOption = (e) => {
    e.preventDefault();
    const cleanOpt = optionInput.trim();
    if (cleanOpt && !variantForm.options.includes(cleanOpt)) {
      setVariantForm({
        ...variantForm,
        options: [...variantForm.options, cleanOpt]
      });
      setOptionInput('');
    }
  };

  const handleOptionKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddOption(e);
    }
  };

  const handleRemoveOption = (optToRemove) => {
    setVariantForm({
      ...variantForm,
      options: variantForm.options.filter(opt => opt !== optToRemove)
    });
  };

  // Submit form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!variantForm.name.trim()) return;

    try {
      const payload = {
        name: variantForm.name.trim(),
        options: variantForm.options
      };

      if (modalType === 'add') {
        await api.post('/variants', payload);
      } else {
        await api.put(`/variants/${variantForm.id}`, payload);
      }
      fetchVariants();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving variant group:', error);
    }
  };

  // Delete handler
  const handleDeleteVariant = async (id) => {
    try {
      await api.delete(`/variants/${id}`);
      setDeleteConfirmId(null);
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant group:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Product Management</h1>
        <p className="text-sm text-slate-500 mt-1 font-semibold">Manage your entire catalog, categories, and inventory items.</p>
      </div>

      {/* Section controller row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1e293b]">Variant Groups</h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">Manage global product options like Size, Color, and Polish.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">

          {/* Add Variant Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Variant Group</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredVariants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVariants.map((variant) => (
            <div
              key={variant.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow relative"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-emerald-600">
                  <Tag className="w-4 h-4 text-emerald-500 rotate-90" />
                  <span className="font-extrabold text-[#1e293b] text-sm leading-tight">
                    {variant.name}
                  </span>
                </div>

                {/* Triple dots option dropdown trigger */}
                <div>
                  <button
                    onClick={() => setActiveDropdownId(activeDropdownId === variant.id ? null : variant.id)}
                    className="p-1 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {activeDropdownId === variant.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveDropdownId(null)}
                      ></div>
                      <div className="absolute right-6 mt-1 w-28 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
                        <button
                          onClick={() => {
                            openEditModal(variant);
                            setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-2 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(variant.id);
                            setActiveDropdownId(null);
                          }}
                          className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-xs font-bold text-rose-650 flex items-center space-x-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body - Option badges container */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 flex flex-wrap gap-2 min-h-[72px]">
                {variant.options && variant.options.length > 0 ? (
                  variant.options.map((opt, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-750 text-xs font-bold rounded-lg shadow-sm"
                    >
                      {opt}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic pl-1 self-center">No options available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 italic">
          No variant groups found. Click "Add Variant Group" to build options like Color or Size!
        </div>
      )}

      {/* Add / Edit Variant Portal Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full my-8 overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {modalType === 'add' ? 'Add New Variant Group' : 'Edit Variant Group'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Variant Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variant Name</label>
                <input
                  type="text"
                  required
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  placeholder="e.g. Size, Color, Material"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Available Options tag-input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Options</label>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={handleOptionKeyDown}
                    placeholder="Type an option and press Enter..."
                    className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex-shrink-0"
                  >
                    Add
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 block pt-0.5 font-bold">
                  Type an option name and press <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-500 border border-slate-200">Enter</code> or comma.
                </span>

                {/* Option Badge Container */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">Added Options:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-slate-50/50 min-h-[50px] items-center">
                    {variantForm.options.length > 0 ? (
                      variantForm.options.map((opt, i) => (
                        <span
                          key={i}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg shadow-sm"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic pl-1">No options added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-500/15"
                >
                  Save Group
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
              <h3 className="font-extrabold text-slate-800 text-base">Delete Variant Group</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete this variant group? This action cannot be undone and will permanently remove these size/color/polish options from product listings.
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
                onClick={() => handleDeleteVariant(deleteConfirmId)}
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

export default Variants;
