import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />,
};

const colors = {
  success: 'border-emerald-100 bg-white',
  error: 'border-rose-100 bg-white',
  info: 'border-amber-100 bg-white',
};

const barColors = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  info: 'bg-amber-400',
};

// Individual Toast card — renders inline (no portal, container handles portal)
const ToastCard = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onClose?.(), 350);
    }, duration);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => onClose?.(), 350);
  };

  return (
    <div
      className={`min-w-[300px] max-w-sm transition-all duration-300 ease-out
        ${visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}
      `}
    >
      <div className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl shadow-slate-200/80 overflow-hidden ${colors[type]}`}>
        {/* Shrinking progress bar at bottom */}
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${barColors[type]} rounded-full`}
          style={{ animation: `toastShrink ${duration}ms linear forwards` }}
        />
        <style>{`@keyframes toastShrink { from { width: 100%; } to { width: 0%; } }`}</style>

        {icons[type]}
        <p className="text-[13px] font-semibold text-slate-700 leading-snug flex-1 pt-0.5">{message}</p>
        <button
          onClick={handleClose}
          className="p-0.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Hook to use toasts anywhere — call showToast() and render <ToastContainer />
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => createPortal(
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5">
      {toasts.map(t => (
        <ToastCard
          key={t.id}
          message={t.message}
          type={t.type}
          duration={t.duration}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>,
    document.body
  );

  return { showToast, ToastContainer };
};

export default useToast;
