import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
    const id = `confirm-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type: 'confirm', onConfirm, onCancel }]);
  }, []);

  const hideToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md" aria-live="polite">
          <AnimatePresence mode="popLayout">
            {toasts.map(toast => {
              const styles = {
                success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-900 dark:text-emerald-100',
                error: 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-900 dark:text-red-100',
                warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-900 dark:text-amber-100',
                confirm: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 text-indigo-900 dark:text-indigo-100',
                info: 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 text-slate-900 dark:text-slate-100',
              }[toast.type];

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${styles}`}
                >
                  <p className="text-sm font-medium flex-1">{toast.message}</p>
                  {toast.type === 'confirm' ? (
                    <div className="flex gap-2">
                      <button onClick={() => { toast.onConfirm?.(); hideToast(toast.id); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg">Confirmar</button>
                      <button onClick={() => { toast.onCancel?.(); hideToast(toast.id); }} className="px-3 py-1.5 bg-slate-200 text-slate-900 text-xs rounded-lg">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => hideToast(toast.id)} className="material-symbols-outlined text-sm opacity-60">close</button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
