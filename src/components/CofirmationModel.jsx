import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Yes, Confirm",
    cancelText = "Cancel",
    type = "danger", // danger, warning, success
    loading = false,
    showCancel = true,
    onSecondaryConfirm,
    secondaryConfirmText
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle className="text-red-500" size={32} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={32} />;
            case 'success': return <CheckCircle className="text-green-500" size={32} />;
            default: return <AlertTriangle className="text-blue-500" size={32} />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'danger': return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
            case 'warning': return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
            case 'success': return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
            default: return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-sm rounded-xl shadow-2xl transform transition-all scale-100 opacity-100 overflow-hidden"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderWidth: '1px' }}
            >
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`shrink-0 p-2 rounded-full ${type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            {React.cloneElement(getIcon(), { size: 20 })}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                            <h3 className="text-base font-bold leading-tight mb-1" style={{ color: 'var(--text-color)' }}>
                                {title}
                            </h3>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--secondary-color)' }}>
                                {message}
                            </p>
                        </div>

                        {/* Close X (Optional, maybe redundant in compact view but good for UX) */}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-gray-400 dark:hover:bg-gray-700 transition shrink-0"
                            style={{ color: 'var(--secondary-color) dark:text-gray-200' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-1">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-400 dark:hover:bg-gray-800 disabled:opacity-50"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                            >
                                {cancelText}
                            </button>
                        )}

                        {onSecondaryConfirm && secondaryConfirmText && (
                            <button
                                onClick={onSecondaryConfirm}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white shadow-sm transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {secondaryConfirmText}
                            </button>
                        )}

                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${getButtonColor()}`}
                        >
                            {loading ? "Processing..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;