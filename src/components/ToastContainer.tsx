import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-[#10b981]" />;
      case 'error':
        return <AlertCircle size={20} className="text-[#ef4444]" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-[#f59e0b]" />;
      case 'info':
        return <Info size={20} className="text-[#6366f1]" />;
      default:
        return null;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[#10b981]/10 border-[#10b981]/20';
      case 'error':
        return 'bg-[#ef4444]/10 border-[#ef4444]/20';
      case 'warning':
        return 'bg-[#f59e0b]/10 border-[#f59e0b]/20';
      case 'info':
        return 'bg-[#6366f1]/10 border-[#6366f1]/20';
      default:
        return 'bg-[#252742] border-[#404556]';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-[#10b981]';
      case 'error':
        return 'text-[#ef4444]';
      case 'warning':
        return 'text-[#f59e0b]';
      case 'info':
        return 'text-[#6366f1]';
      default:
        return 'text-[#e5e7eb]';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start space-x-3 px-4 py-3 rounded-lg border backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-300',
            getBgColor(toast.type)
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p className={cn('text-sm font-medium', getTextColor(toast.type))}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
