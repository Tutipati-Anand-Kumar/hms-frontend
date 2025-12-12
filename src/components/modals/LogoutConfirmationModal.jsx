import React from 'react';
import { X, LogOut, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, theme }) => {
    if (!isOpen) return null;

    // Use a high z-index to ensure it sits on top of everything, including sidebar
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div
                className="relative w-full max-w-sm rounded-2xl shadow-2xl transform transition-all scale-100 opacity-100 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-color)]"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <LogOut size={20} className="text-red-500" />
                        Confirm Logout
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[var(--sidebar-bg)] transition-colors text-[var(--secondary-color)]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-[var(--secondary-color)] text-base leading-relaxed">
                        Are you sure you want to log out? <br />
                        You will need to sign in again to access your account.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-4 border-t border-[var(--border-color)] bg-[var(--bg-color)]/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border-color)] hover:bg-[var(--sidebar-bg)] transition-colors text-[var(--text-color)]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmationModal;
