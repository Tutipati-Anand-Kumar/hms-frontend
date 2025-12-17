import React from "react";
import { FaArrowLeft, FaTrash, FaCopy, FaPen, FaCheckDouble } from "react-icons/fa";

const SelectionNavbar = ({ count, onClear, onEdit, onCopy, onSelectAll, onDelete, canEdit }) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 flex items-center justify-between px-4 lg:px-6 transition-all duration-300 shadow-md">
            <div className="flex items-center gap-4">
                <button
                    onClick={onClear}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-200"
                >
                    <FaArrowLeft size={20} />
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-white animate-fade-in">
                    {count} Selected
                </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {canEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-200"
                        title="Edit"
                    >
                        <FaPen size={18} />
                    </button>
                )}
                <button
                    onClick={onCopy}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-200"
                    title="Copy"
                >
                    <FaCopy size={18} />
                </button>
                <button
                    onClick={onSelectAll}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-200"
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
