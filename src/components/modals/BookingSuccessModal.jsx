import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const BookingSuccessModal = ({ isOpen, onClose, message }) => {
    useEffect(() => {
        if (isOpen) {
            // Auto close after 3 seconds if needed, but user might want to read it.
            // Requirement says "ok" button, so manual close is better.
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-2 px-4 bg-black/30 backdrop-blur-sm transition-opacity">
            <div
                className="relative w-full max-w-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl transform transition-all animate-in fade-in slide-in-from-top-4 duration-300"
                role="alertdialog"
            >
                <div className="p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-color)] mb-1">
                        Success!
                    </h3>

                    <p className="text-[var(--secondary-color)] text-xs mb-3">
                        {message || "Appointment request sent successfully!"}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm focus:outline-none"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                        OK
                    </button>
                </div>

                {/* Close X Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full text-[var(--secondary-color)] hover:bg-[var(--bg-color)] transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default BookingSuccessModal;
