import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage } from '../types';

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto min-w-[250px] max-w-sm px-4 py-3 border-l-4 shadow-2xl animate-in slide-in-from-right fade-in duration-300
              ${toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : ''}
              ${toast.type === 'success' ? 'bg-green-900/90 border-green-500 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-zinc-900/90 border-gold-500 text-gold-100' : ''}
            `}
          >
            <div className="flex justify-between items-start gap-3">
              <p className="text-xs font-bold font-sans tracking-wide uppercase">{toast.message}</p>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/50 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};