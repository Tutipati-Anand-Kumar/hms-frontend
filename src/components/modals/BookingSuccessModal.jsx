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
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 px-4 bg-black/30 backdrop-blur-sm transition-opacity">
            <div
                className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl transform transition-all animate-in fade-in slide-in-from-top-4 duration-300"
                role="alertdialog"
            >
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>

                    <h3 className="text-xl font-bold text-[var(--text-color)] mb-2">
                        Success!
                    </h3>

                    <p className="text-[var(--secondary-color)] mb-6">
                        {message || "Appointment request sent successfully!"}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                        OK
                    </button>
                </div>

                {/* Close X Button (Optional, but good for UX) */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 rounded-full text-[var(--secondary-color)] hover:bg-[var(--bg-color)] transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default BookingSuccessModal;
