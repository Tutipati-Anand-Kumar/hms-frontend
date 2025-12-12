// ... (other imports)
import { useNavigate } from 'react-router-dom';
import { deleteAccount, logoutUser, getActiveUser } from '../../api/authservices/authservice';
import {
    User, Lock, Bell, Moon, Sun, Globe, Shield,
    ChevronRight, ToggleLeft, ToggleRight, HelpCircle, X
} from 'lucide-react';
import { useEffect, useState } from 'react';

const Settings = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);

    // Support Modal State - Removed
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Status Modal State
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Get theme from localStorage or default to dark
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme === "dark" || savedTheme === null;
    });

    // Apply theme effect
    useEffect(() => {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const user = getActiveUser();
    const isSuperAdmin = user?.role === 'super-admin';

    const sections = [
        {
            title: "Account Security",
            items: [
                {
                    icon: Lock,
                    label: "Change Password",
                    desc: "Update your password regularly",
                    onClick: () => navigate('/forgotpassword')
                },
            ]
        },
        {
            title: "Preferences",
            items: [
                {
                    icon: darkMode ? Moon : Sun,
                    label: "Dark Mode",
                    desc: darkMode ? "Switch to light theme" : "Switch to dark theme",
                    toggle: true,
                    value: darkMode,
                    setValue: setDarkMode
                },
                {
                    icon: Globe,
                    label: "Language",
                    desc: "English (US)",
                    action: true
                },
            ]
        },
    ].filter(section => {
        return true;
    });

    return (
        <div className="h-full w-full bg-[var(--bg-color)] md:p-6 relative">
            <div className="max-w-7xl mx-auto space-y-4">

                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-[var(--text-color)] mb-1 max-sm:text-[18px]">Settings</h1>
                    <p className="text-sm text-[var(--secondary-color)]">Manage your account preferences and security</p>
                </div>

                {sections.map((section, idx) => (
                    <div key={idx} className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-color)]">
                            <h3 className="text-base font-semibold text-[var(--text-color)]">{section.title}</h3>
                        </div>
                        <div className="divide-y divide-[var(--border-color)]">
                            {section.items.map((item, itemIdx) => (
                                <div
                                    key={itemIdx}
                                    onClick={() => item.onClick && item.onClick()}
                                    className="p-4 flex items-center justify-between hover:bg-[var(--bg-color)] transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[var(--text-color)] font-medium text-sm mb-0.5">{item.label}</h4>
                                            <p className="text-xs text-[var(--secondary-color)]">{item.desc}</p>
                                        </div>
                                    </div>

                                    {item.toggle ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                item.setValue(!item.value);
                                            }}
                                            className={`transition-colors ${item.value ? 'text-blue-500' : 'text-gray-500'}`}
                                        >
                                            {item.value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                        </button>
                                    ) : (
                                        <ChevronRight size={18} className="text-[var(--secondary-color)] group-hover:text-[var(--text-color)] transition-colors" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                    >
                        Delete Account
                    </button>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-2xl border border-red-500/20 shadow-2xl p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-color)] mb-2">Delete Account?</h2>
                            <p className="text-[var(--secondary-color)] mb-6 text-sm">
                                Are you sure you want to delete your account? This action cannot be undone.
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-medium bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
                                >
                                    No, Keep It
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const user = getActiveUser();
                                            const userId = user?.id || user?._id;
                                            if (userId) {
                                                await deleteAccount(userId);
                                                await logoutUser(userId);
                                                navigate('/login');
                                            } else {
                                                setIsDeleteModalOpen(false);
                                                setStatusModal({
                                                    isOpen: true,
                                                    type: 'error',
                                                    title: 'User Not Found',
                                                    message: 'Could not identify the active user account.'
                                                });
                                            }
                                        } catch (error) {
                                            console.error("Delete failed", error);
                                            setIsDeleteModalOpen(false);
                                            setStatusModal({
                                                isOpen: true,
                                                type: 'error',
                                                title: 'Deletion Failed',
                                                message: 'Failed to delete account. Please try again.'
                                            });
                                        }
                                    }}
                                    className="px-5 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {statusModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${statusModal.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {statusModal.type === 'success' ? (
                                <Shield className="w-8 h-8 text-green-500" />
                            ) : (
                                <X className="w-8 h-8 text-red-500" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-color)] mb-2">{statusModal.title}</h2>
                        <p className="text-[var(--secondary-color)] mb-6 text-sm">
                            {statusModal.message}
                        </p>
                        <button
                            onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                            className="w-full py-2.5 rounded-xl font-medium bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
