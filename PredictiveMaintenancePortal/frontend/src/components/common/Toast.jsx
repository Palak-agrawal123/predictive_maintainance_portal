import React from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export function ToastContainer() {
  const { toasts, removeToast } = useAppData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-3">
      {toasts.map(toast => {
        let border = 'border-[#252B27]';
        let icon = <Info size={16} className="text-[#38BDF8] flex-shrink-0" />;

        if (toast.type === 'success') {
          border = 'border-[#43D17D]/40';
          icon = <CheckCircle2 size={16} className="text-[#43D17D] flex-shrink-0" />;
        } else if (toast.type === 'error') {
          border = 'border-[#FF5B64]/40';
          icon = <AlertCircle size={16} className="text-[#FF5B64] flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`bg-[#171B18] border ${border} text-text-main p-3 rounded shadow-lg text-xs font-mono flex items-center justify-between gap-3 animate-fadeIn`}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-main p-1"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
