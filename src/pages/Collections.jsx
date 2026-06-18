import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  Search,
  Plus,
  X,
  Check,
  MoreHorizontal,
  LayoutGrid,
  Pencil,
  Trash2,
  AlertCircle,
  Clock
} from 'lucide-react';

const THEME_COLORS = [
  { id: 'pink', name: 'Pink Rose', hex: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
  { id: 'orange', name: 'Orange Amber', hex: '#f97316', gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' },
  { id: 'blue', name: 'Sky Blue', hex: '#0ea5e9', gradient: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)' },
  { id: 'purple', name: 'Violet Purple', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' },
  { id: 'green', name: 'Emerald Green', hex: '#10b981', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
  { id: 'navy', name: 'Dark Navy', hex: '#1e293b', gradient: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' }
];

export const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [collectionForm, setCollectionForm] = useState({
    id: null,
    name: '',
    description: '',
    status: 'Active',
    theme: 'pink'
  });

  // Fetch collections
  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await api.get('/collections');
      if (Array.isArray(data)) {
        setCollections(data.map(c => ({ ...c, id: c._id })));
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Search Filter
  const filteredCollections = collections.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  // Open Add Helper
  const openCreateModal = () => {
    setCollectionForm({
      id: null,
      name: '',
      description: '',
      status: 'Active',
      theme: 'pink'
    });
    setModalType('add');
    setIsModalOpen(true);
  };

  // Open Edit Helper
  const openEditModal = (collection) => {
    setCollectionForm({
      id: collection.id,
      name: collection.name,
      description: collection.description || '',
      status: collection.status,
      theme: collection.theme
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!collectionForm.name.trim()) return;

    try {
      const payload = {
        name: collectionForm.name.trim(),
        description: collectionForm.description.trim(),
        status: collectionForm.status,
        theme: collectionForm.theme
      };

      if (modalType === 'add') {
        await api.post('/collections', payload);
      } else {
        await api.put(`/collections/${collectionForm.id}`, payload);
      }
      fetchCollections();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  };

  // Delete Handler
  const handleDeleteCollection = async (id) => {
    try {
      await api.delete(`/collections/${id}`);
      setDeleteConfirmId(null);
      fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title/Sub Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Product Management</h1>
        <p className="text-sm text-slate-500 mt-1 font-semibold">Manage your entire catalog, categories, and inventory items.</p>
      </div>

      {/* Collections header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1e293b]">Collections Gallery</h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">Group products into visual, thematic collections like 'Diwali' or 'Bridal'.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">

          {/* Create Collection Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCollections.map((col) => {
            const theme = THEME_COLORS.find(t => t.id === col.theme) || THEME_COLORS[0];

            return (
              <div
                key={col.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative h-[280px] hover:shadow-md transition-shadow duration-300"
              >
                {/* Colored Header */}
                <div
                  className="h-28 p-6 relative flex flex-col justify-end"
                  style={{ background: theme.gradient }}
                >
                  <h3 className="text-white font-extrabold text-lg leading-tight truncate pr-8">
                    {col.name}
                  </h3>

                  {/* Three-dots actions dropdown trigger */}
                  <div className="absolute top-4 right-4">
                    <button
                      type="button"
                      onClick={() => setActiveDropdownId(activeDropdownId === col.id ? null : col.id)}
                      className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Actions Dropdown */}
                    {activeDropdownId === col.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveDropdownId(null)}
                        ></div>
                        <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
                          <button
                            onClick={() => {
                              openEditModal(col);
                              setActiveDropdownId(null);
                            }}
                            className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-2 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(col.id);
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

                {/* Overlapping grid icon circle */}
                <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center absolute right-6 top-[92px] shadow-md shadow-slate-200/50 z-10">
                  <LayoutGrid className="w-4 h-4 text-slate-400" />
                </div>

                {/* Bottom content section */}
                <div className="p-6 pt-7 bg-white flex flex-col justify-between flex-1">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">
                    {col.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    {/* Status badge */}
                    <div className="flex items-center">
                      {col.status === 'Active' ? (
                        <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <Check className="w-3 h-3 mr-1 text-emerald-500 stroke-[3px]" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100">
                          <Clock className="w-3 h-3 mr-1 text-amber-500 stroke-[3px]" />
                          Draft
                        </span>
                      )}
                    </div>

                    {/* View Items Link */}
                    <button className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold rounded-lg text-[10px] transition-colors flex items-center space-x-1 cursor-pointer">
                      <span>View Items</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 italic">
          No collections found. Click "Create Collection" to build your first catalog group!
        </div>
      )}

      {/* Create / Edit Collection Portal Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full my-8 overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {modalType === 'add' ? 'Create Collection' : 'Edit Collection'}
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
              {/* Collection Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={collectionForm.name}
                  onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                  placeholder="e.g. Diwali Specials"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                  placeholder="Describe this collection..."
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Status and Cover Theme Selection */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                {/* Status Selection */}
                <div className="space-y-1.5 w-full sm:w-[130px] flex-shrink-0">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status *</label>
                  <select
                    value={collectionForm.status}
                    onChange={(e) => setCollectionForm({ ...collectionForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                {/* Theme selection list */}
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cover Theme</label>
                  <div className="flex items-center gap-2 pt-0.5 flex-nowrap">
                    {THEME_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setCollectionForm({ ...collectionForm, theme: col.id })}
                        className={`w-8 h-8 rounded-full relative flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-sm border border-slate-200 flex-shrink-0 ${collectionForm.theme === col.id ? 'ring-2 ring-offset-2 ring-emerald-500 scale-105' : ''
                          }`}
                        style={{ background: col.gradient }}
                        title={col.name}
                      >
                        {collectionForm.theme === col.id && (
                          <Check className="w-4 h-4 text-white stroke-[3px]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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
                  {modalType === 'add' ? 'Save Collection' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-extrabold text-slate-800 text-base">Delete Collection</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete this collection? This action cannot be undone and will permanently remove this visual group from your dashboard.
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
                onClick={() => handleDeleteCollection(deleteConfirmId)}
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

export default Collections;
