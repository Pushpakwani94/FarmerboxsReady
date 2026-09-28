import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  entityName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  entityName,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      bgIcon: 'bg-rose-100 text-rose-600 ring-8 ring-rose-50',
      icon: Trash2,
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50 hover:shadow-lg focus:ring-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      tagText: 'Destructive Action'
    },
    warning: {
      bgIcon: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50',
      icon: AlertTriangle,
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200/50 hover:shadow-lg focus:ring-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      tagText: 'Warning Notice'
    },
    info: {
      bgIcon: 'bg-blue-100 text-blue-600 ring-8 ring-blue-50',
      icon: Info,
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 hover:shadow-lg focus:ring-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      tagText: 'Information'
    },
    success: {
      bgIcon: 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50',
      icon: CheckCircle2,
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50 hover:shadow-lg focus:ring-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tagText: 'Confirmation'
    }
  };

  const config = typeConfig[type] || typeConfig.danger;
  const IconComponent = config.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top subtle decorative strip */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          type === 'danger' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
          type === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
          type === 'info' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
          'bg-gradient-to-r from-emerald-500 to-green-600'
        }`} />

        {/* Header Close button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          {/* Action Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform ${config.bgIcon}`}>
            <IconComponent className="w-7 h-7" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h3>

          {/* Entity Name Pill (if provided) */}
          {entityName && (
            <div className={`mt-2.5 px-3 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 max-w-full truncate ${config.badgeBg}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
              <span className="truncate">{entityName}</span>
            </div>
          )}

          {/* Descriptive Message */}
          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xs sm:max-w-sm">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all cursor-pointer shadow-2xs hover:border-slate-300 disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-1/2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 ${config.confirmBtn}`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmLabel}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
