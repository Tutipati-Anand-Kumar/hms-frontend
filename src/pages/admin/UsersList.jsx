import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getAllUsers, deleteUser, updateUser } from "../../api/admin/adminServices";
import { Trash2, User, Search, X, Calendar, MapPin, Activity, Pill, AlertCircle, Building2 } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import toast from "react-hot-toast";

const getInitials = (name) => {
    if (!name) return "";
    if (name.startsWith("FD - ")) {
        const hospitalName = name.replace("FD - ", "");
        const parts = hospitalName.trim().split(" ");
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const getColor = (name) => {
    if (!name) return "bg-gray-500";
    const colors = ["bg-red-500", "bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const UsersList = ({ role }) => {
    const { searchQuery, setSearchPlaceholder, setFilters, activeFilters } = useOutletContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    // Debug log
    console.log("UsersList - Received Search Query:", searchQuery);

    useEffect(() => {
        setSearchPlaceholder(role ? `Search ${role}s...` : "Search users by name...");
        setFilters([
            {
                key: "role",
                label: "Filter by Role",
                options: [
                    { value: "doctor", label: "Doctor" },
                    { value: "patient", label: "Patient" },
                    { value: "admin", label: "Admin" },
                    { value: "helpdesk", label: "Front Desk" },
                ]
            }
        ]);
        fetchUsers();
    }, [role]);

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers(role);
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const initiateDelete = (e, id) => {
        e.stopPropagation();
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await deleteUser(deleteModal.id);
            setUsers(users.filter((u) => u._id !== deleteModal.id));
            toast.success("User deleted successfully");
        } catch (err) {
            toast.error("Failed to delete user");
        } finally {
            setDeleteModal({ show: false, id: null });
        }
    };

    const handleEditClick = (e, user) => {
        e.stopPropagation();
        setEditingUser({ ...user });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const updated = await updateUser(editingUser._id || editingUser.doctorProfileId, {
                name: editingUser.name,
                email: editingUser.email,
                mobile: editingUser.mobile,
                role: editingUser.role
            });

            setUsers(users.map(u => (u._id === updated._id || u.doctorProfileId === updated._id) ? { ...u, ...updated } : u));
            setEditingUser(null);
            toast.success("User updated successfully");
        } catch (err) {
            toast.error("Failed to update user");
        }
    };

    const handleRowClick = (user) => {
        console.log("Selected User Details:", user);
        setSelectedUser(user);
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = activeFilters?.role ? user.role === activeFilters.role : true;
        return matchesSearch && matchesRole;
    });

    const getGradient = (role) => {
        switch (role) {
            case 'doctor': return 'from-blue-900/40 to-purple-900/40';
            case 'patient': return 'from-green-900/40 to-teal-900/40';
            case 'admin': return 'from-red-900/40 to-orange-900/40';
            case 'helpdesk': return 'from-orange-900/40 to-yellow-900/40';
            default: return 'from-gray-900/40 to-slate-900/40';
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'doctor': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'patient': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'helpdesk': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    if (loading) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Loading users...</div>;

    return (
        <div>
            <h1 className="text-2xl max-[600px]:text-lg font-bold mb-6 capitalize" style={{ color: 'var(--text-color)' }}>
                {role ? `${role}s List` : "All Users"}
            </h1>

            <div className="rounded-xl border overflow-hidden w-full max-w-full" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left" style={{ color: 'var(--text-color)' }}>
                        <thead className="uppercase text-xs" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--secondary-color)' }}>
                            <tr>
                                <th className="px-4 md:px-6 py-3">Name</th>
                                <th className="px-4 md:px-6 py-3">Email</th>
                                <th className="px-4 md:px-6 py-3 hidden md:table-cell">{role === 'doctor' ? 'Specialist' : 'Role'}</th>
                                <th className="px-4 md:px-6 py-3 hidden lg:table-cell">Mobile</th>
                                <th className="px-4 md:px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="hover:bg-opacity-50 transition-colors"
                                        style={{ backgroundColor: 'var(--card-bg)' }}
                                    >
                                        <td
                                            className="px-4 md:px-6 py-4 flex items-center gap-3 cursor-pointer max-w-[180px]"
                                            onClick={() => handleRowClick(user)}
                                        >
                                            {user.role === 'doctor' ? (
                                                <img
                                                    src={user.avatar || "/avatar.png"}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover border flex-shrink-0"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                    onError={(e) => { e.target.src = "/avatar.png"; }}
                                                />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${getColor(user.name)}`}>
                                                    {getInitials(user.name)}
                                                </div>
                                            )}
                                            <span className="font-medium hover:text-blue-400 transition-colors truncate" style={{ color: 'var(--text-color)' }}>{user.name}</span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 max-w-[150px] truncate">{user.email}</td>
                                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                                            {role === 'doctor' && user.specialties && user.specialties.length > 0 ? (
                                                <span className="text-blue-300">
                                                    {user.specialties.join(", ")}
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'doctor' ? 'bg-green-900 text-green-300' :
                                                    user.role === 'admin' ? 'bg-purple-900 text-purple-300' :
                                                        user.role === 'helpdesk' ? 'bg-orange-900 text-orange-300' :
                                                            'bg-gray-700 text-gray-300'
                                                    }`}>
                                                    {user.role === 'helpdesk' ? 'Front Desk' : user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden lg:table-cell">{user.mobile}</td>
                                        <td className="px-4 md:px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={(e) => handleEditClick(e, user)}
                                                className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                            </button>
                                            <button
                                                onClick={(e) => initiateDelete(e, user._id)}
                                                className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center" style={{ color: 'var(--secondary-color)' }}>
                                        No users found matching "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
                    <div className="rounded-xl border w-full max-w-md p-6 shadow-2xl"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="hover:text-white" style={{ color: 'var(--secondary-color)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1" style={{ color: 'var(--secondary-color)' }}>Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                                />

                            </div>
                            <div>
                                <label className="block text-sm mb-1" style={{ color: 'var(--secondary-color)' }}>Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1" style={{ color: 'var(--secondary-color)' }}>Mobile</label>
                                <input
                                    type="text"
                                    value={editingUser.mobile}
                                    onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                                    className="w-full border rounded p-2 focus:border-blue-500 outline-none"
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 hover:text-white" style={{ color: 'var(--secondary-color)' }}>Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Delete */}
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                type="danger"
                confirmText="Delete"
            />
            {/* User Details Modal - Unified Premium Design */}
            {selectedUser && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        className="rounded-2xl border w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Background Pattern */}
                        <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-r ${getGradient(selectedUser.role)} z-0`}></div>

                        {/* Close Button - Increased z-index and ensuring it's clickable */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(null);
                            }}
                            className="absolute top-4 right-4 text-white hover:text-gray-200 z-50 bg-black/30 hover:bg-black/50 rounded-full p-2 transition-all cursor-pointer"
                        >
                            <X size={24} />
                        </button>

                        <div className="relative z-10 p-8 overflow-y-auto no-scrollbar">
                            {/* Profile Header */}
                            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 shadow-lg flex items-center justify-center"
                                            style={{ borderColor: 'var(--card-bg)', backgroundColor: 'var(--bg-color)' }}>
                                            {selectedUser.role === 'doctor' || selectedUser.avatar ? (
                                                <img
                                                    src={selectedUser.avatar || "/avatar.png"}
                                                    alt={selectedUser.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = "/avatar.png"; }}
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-4xl font-bold text-white ${getColor(selectedUser.name)}`}>
                                                    {getInitials(selectedUser.name)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="absolute -bottom-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full border-4"
                                            style={{ borderColor: 'var(--card-bg)' }}>
                                            Active
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-grow pt-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>{selectedUser.name}</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleBadgeColor(selectedUser.role)}`}>
                                            {selectedUser.role === 'helpdesk' ? 'Front Desk' : selectedUser.role}
                                        </span>
                                    </div>
                                    <p className="font-mono text-sm" style={{ color: 'var(--secondary-color)' }}>ID: {selectedUser.doctorId || selectedUser.patientProfileId || selectedUser._id}</p>

                                    {selectedUser.bio && (
                                        <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--text-color)' }}>
                                            {selectedUser.bio}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Info Card (Common) */}
                                <div className="rounded-xl p-5 border transition-colors"
                                    style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--secondary-color)' }}>
                                        <User size={14} /> Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Email Address</span>
                                            <span className="font-medium" style={{ color: 'var(--text-color)' }}>{selectedUser.email}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Phone Number</span>
                                            <span className="font-medium" style={{ color: 'var(--text-color)' }}>{selectedUser.mobile}</span>
                                        </div>
                                        {selectedUser.address && (
                                            <div className="flex flex-col">
                                                <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Address</span>
                                                <span className="font-medium" style={{ color: 'var(--text-color)' }}>{selectedUser.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Role Specific Details */}
                                {selectedUser.role === 'doctor' && (
                                    <div className="rounded-xl p-5 border transition-colors"
                                        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--secondary-color)' }}>
                                            <Activity size={14} /> Professional Details
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Specialties</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {selectedUser.specialties && selectedUser.specialties.length > 0 ? (
                                                        selectedUser.specialties.map((spec, index) => (
                                                            <span key={index} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded border border-blue-800/50">
                                                                {spec}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--secondary-color)' }}>-</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Qualifications</span>
                                                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>{selectedUser.qualifications?.join(", ") || "-"}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Experience Since</span>
                                                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                                                        {selectedUser.experienceStart ? new Date(selectedUser.experienceStart).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedUser.role === 'patient' && (
                                    <div className="rounded-xl p-5 border transition-colors"
                                        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--secondary-color)' }}>
                                            <Activity size={14} /> Medical Profile
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Date of Birth</span>
                                                <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                                                    {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : "-"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Gender</span>
                                                <span className="font-medium capitalize" style={{ color: 'var(--text-color)' }}>{selectedUser.gender || "-"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedUser.allergies && selectedUser.allergies !== "None" && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Allergies</span>
                                                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>{selectedUser.allergies}</span>
                                                </div>
                                            )}
                                            {selectedUser.conditions && selectedUser.conditions !== "None" && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Chronic Conditions</span>
                                                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>{selectedUser.conditions}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedUser.role === 'helpdesk' && (
                                    <div className="rounded-xl p-5 border transition-colors"
                                        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--secondary-color)' }}>
                                            <Building2 size={14} /> Assignment Details
                                        </h3>
                                        <div className="flex flex-col">
                                            <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>Assigned Hospital</span>
                                            <span className="font-medium text-lg mt-1" style={{ color: 'var(--text-color)' }}>
                                                {selectedUser.hospitalName || "Not Assigned"}
                                            </span>
                                            {selectedUser.hospitalId && (
                                                <span className="text-xs mt-1" style={{ color: 'var(--secondary-color)' }}>ID: {selectedUser.hospitalId}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Extra Lists */}
                            {selectedUser.role === 'doctor' && selectedUser.hospitals && selectedUser.hospitals.length > 0 && (
                                <div className="mt-6 rounded-xl p-5 border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--secondary-color)' }}>Affiliated Hospitals</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedUser.hospitals.map((h, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border"
                                                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                                <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                                                    H
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{h.hospital?.name || "Unknown Hospital"}</p>
                                                    <p className="text-xs" style={{ color: 'var(--secondary-color)' }}>{h.hospital?.address || "No address"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersList;