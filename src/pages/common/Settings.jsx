// ... (other imports)
import { useNavigate } from 'react-router-dom';
import { deleteAccount, logoutUser, getActiveUser } from '../../api/authservices/authservice';
import {
    User, Lock, Bell, Moon, Sun, Globe, Shield,
    ChevronRight, ToggleLeft, ToggleRight, HelpCircle, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';

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
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={async () => {
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
                                type: 'danger',
                                title: 'User Not Found',
                                message: 'Could not identify the active user account.'
                            });
                        }
                    } catch (error) {
                        console.error("Delete failed", error);
                        setIsDeleteModalOpen(false);
                        setStatusModal({
                            isOpen: true,
                            type: 'danger',
                            title: 'Deletion Failed',
                            message: 'Failed to delete account. Please try again.'
                        });
                    }
                }}
                title="Delete Account?"
                message="Are you sure you want to delete your account? This action cannot be undone."
                type="danger"
                confirmText="Yes, Delete"
            />

            {/* Status Modal - Using ConfirmationModal as an Alert */}
            <ConfirmationModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                onConfirm={() => setStatusModal({ ...statusModal, isOpen: false })}
                title={statusModal.title}
                message={statusModal.message}
                type={statusModal.type === 'error' ? 'danger' : statusModal.type}
                confirmText="Close"
                cancelText="Close" // Hiding one button effectively or just formatting as alert
            />
        </div>
    );
};

export default Settings;
