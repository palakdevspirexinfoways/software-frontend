import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  FileText, Search, Trash2, Edit3, Calendar, User,
  Phone, MapPin, X, Package, Plus, Download, Clock, ArrowLeft
} from 'lucide-react';

const fmt = (n) => n ? '₹' + Number(n).toLocaleString('en-IN') : '—';

export const Drafts = ({ onEditDraft, onBack }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/invoices');
      if (Array.isArray(data)) {
        const draftInvoices = data
          .filter(inv => inv.payment === 'Draft')
          .map(inv => ({
            ...inv,
            id: inv.invoiceId,
            issueDate: inv.issueDate
              ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—',
          }));
        setDrafts(draftInvoices);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, []);

  const handleDelete = async (inv) => {
    if (!window.confirm(`Delete draft ${inv.id}? This cannot be undone.`)) return;
    try {
      setDeletingId(inv.id);
      await api.delete(`/invoices/${inv.id}`);
      setDrafts(prev => prev.filter(d => d.id !== inv.id));
      if (selectedDraft?.id === inv.id) setSelectedDraft(null);
    } catch (err) {
      console.error('Error deleting draft:', err);
    } finally {
      setDeletingId(null);
    }
  };


  const filtered = drafts.filter(d =>
    (d.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Saved Drafts</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Incomplete invoices saved automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            {drafts.length} Draft{drafts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drafts by client or invoice ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
          />
        </div>
        <button
          onClick={fetchDrafts}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold">Loading drafts...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-600 text-base">No Drafts Found</p>
            <p className="text-xs mt-1">Incomplete invoices will appear here automatically</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(draft => (
            <div
              key={draft._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 group overflow-hidden"
            >
              {/* Card top strip */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

              <div className="p-5 space-y-4">
                {/* Invoice ID + date */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {draft.id || 'DRAFT'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {draft.issueDate}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Draft
                  </span>
                </div>

                {/* Client info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="font-bold truncate">{draft.client || 'No client set'}</span>
                  </div>
                  {draft.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span>{draft.phone}</span>
                    </div>
                  )}
                  {draft.address && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="truncate">{draft.address}</span>
                    </div>
                  )}
                </div>

                {/* Items summary */}
                {draft.items && draft.items.length > 0 ? (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Package className="w-3 h-3" /> {draft.items.length} Item{draft.items.length !== 1 ? 's' : ''}
                    </p>
                    {draft.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium truncate max-w-[60%]">{item.product}</span>
                        <span className="text-slate-400">×{item.qty}</span>
                      </div>
                    ))}
                    {draft.items.length > 3 && (
                      <p className="text-[10px] text-slate-400">+{draft.items.length - 3} more...</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 text-center">No items added</p>
                  </div>
                )}

                {/* Total */}
                {draft.grandTotal > 0 && (
                  <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500 font-semibold">Total</span>
                    <span className="font-extrabold text-slate-800">{fmt(draft.grandTotal)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedDraft(draft)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View
                  </button>
                  {onEditDraft && (
                    <button
                      onClick={() => onEditDraft(draft)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Continue
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(draft)}
                    disabled={deletingId === draft.id}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDraft && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col" style={{ maxHeight: '85vh', overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Draft Details</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{selectedDraft.id || 'Draft'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDraft(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Info</p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <User className="w-4 h-4 text-slate-400" /> {selectedDraft.client || '—'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-300" /> {selectedDraft.phone || '—'}
                </div>
                {selectedDraft.address && (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 mt-0.5" /> {selectedDraft.address}
                  </div>
                )}
              </div>

              {selectedDraft.items && selectedDraft.items.length > 0 && (
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-2.5 px-4 text-left text-[10px] font-bold text-slate-400 uppercase">Product</th>
                        <th className="py-2.5 px-4 text-center text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                        <th className="py-2.5 px-4 text-right text-[10px] font-bold text-slate-400 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedDraft.items.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-700">{item.product}</td>
                          <td className="py-3 px-4 text-center text-slate-500">{item.qty}</td>
                          <td className="py-3 px-4 text-right text-slate-700 font-bold">{fmt(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedDraft.grandTotal > 0 && (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-slate-700">Grand Total</span>
                  <span className="text-xl font-black text-emerald-600">{fmt(selectedDraft.grandTotal)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
              <button
                onClick={() => { handleDelete(selectedDraft); setSelectedDraft(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-rose-200 rounded-xl text-rose-500 text-xs font-bold hover:bg-rose-50 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Draft
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDraft(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close
                </button>
                {onEditDraft && (
                  <button
                    onClick={() => { onEditDraft(selectedDraft); setSelectedDraft(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Continue Editing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Drafts;
