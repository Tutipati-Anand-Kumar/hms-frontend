import React from "react";
import { FaArrowLeft, FaTrash, FaCopy, FaPen, FaCheckDouble } from "react-icons/fa";

const SelectionNavbar = ({ count, onClear, onEdit, onCopy, onSelectAll, onDelete, canEdit }) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-[var(--navbar-bg)] border-b z-40 flex items-center justify-between px-4 lg:px-6 transition-all duration-300 shadow-md" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-4">
                <button
                    onClick={onClear}
                    className="p-2 rounded-full hover:bg-[var(--card-bg)] transition-colors text-[var(--text-color)]"
                >
                    <FaArrowLeft size={20} />
                </button>
                <span className="text-xl font-bold text-[var(--text-color)] animate-fade-in">
                    {count} Selected
                </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {canEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors text-[var(--text-color)]"
                        title="Edit"
                    >
                        <FaPen size={18} />
                    </button>
                )}
                <button
                    onClick={onCopy}
                    className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors text-[var(--text-color)]"
                    title="Copy"
                >
                    <FaCopy size={18} />
                </button>
                <button
                    onClick={onSelectAll}
                    className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors text-[var(--text-color)]"
                    title="Select All"
                >
                    <FaCheckDouble size={18} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-red-500"
                    title="Delete"
                >
                    <FaTrash size={18} />
                </button>
            </div>
        </div>
    );
};

export default SelectionNavbar;
