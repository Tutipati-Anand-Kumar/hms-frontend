import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Calendar, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { API } from "../../../api/authservices/authservice";

const DoctorLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        startDate: "",
        endDate: "",
        reason: "",
    });

    const fetchLeaves = async () => {
        try {
            const res = await API.get("/leaves");
            setLeaves(res.data);
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error("Failed to load leave history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate: Start Date cannot be after End Date. Equal dates are allowed (single day leave).
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error("End date must be after or equal to start date");
            return;
        }

        try {
            await API.post("/leaves/request", formData);
            toast.success("Leave requested successfully");
            setShowModal(false);
            setFormData({ startDate: "", endDate: "", reason: "" });
            fetchLeaves();
        } catch (error) {
            console.error("Error requesting leave:", error);
            toast.error(error.response?.data?.message || "Failed to request leave");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved": return "text-green-400 bg-[var(--card-bg)] border border-green-600";
            case "rejected": return "text-red-400 bg-[var(--card-bg)] border border-red-600";
            default: return "text-yellow-400 bg-[var(--card-bg)] border border-yellow-600";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved": return <CheckCircle className="w-5 h-5" />;
            case "rejected": return <XCircle className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    return (
        <div className="h-full space-y-6" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold  max-sm:text-[16px]" style={{ color: 'var(--text-color)' }}>Leave Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2  max-sm:px-2 max-sm:py-1 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--primary-color)', border: '1px solid var(--border-color)' }}
                >
                    <Plus className="w-5 h-5" />
                    Leave
                </button>
            </div>

            {/* Leave History List */}
            <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <h2 className="font-semibold" style={{ color: 'var(--text-color)' }}>Leave History</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center" style={{ color: 'var(--secondary-color)' }}>Loading...</div>
                ) : leaves.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--secondary-color)' }}>No leave requests found.</div>
                ) : (
                    <div className="overflow-x-auto" style={{ backgroundColor: 'var(--bg-color)' }}>
                        <table className="w-full text-left" style={{ backgroundColor: 'var(--bg-color)' }}>
                            <thead className="text-sm" style={{ color: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                                <tr>
                                    <th className="p-4 font-medium">Start Date</th>
                                    <th className="p-4 font-medium">End Date</th>
                                    <th className="p-4 font-medium">Reason</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Applied On</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                                {leaves.map((leave) => (
                                    <tr key={leave._id} className="transition-colors" style={{ backgroundColor: 'var(--bg-color)' }}>
                                        <td className="p-4" style={{ color: 'var(--text-color)' }}>{new Date(leave.startDate).toLocaleDateString()}</td>
                                        <td className="p-4" style={{ color: 'var(--text-color)' }}>{new Date(leave.endDate).toLocaleDateString()}</td>
                                        <td className="p-4" style={{ color: 'var(--text-color)' }}>{leave.reason}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                                                {getStatusIcon(leave.status)}
                                                <span className="ml-1">{leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}</span>
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--secondary-color)' }}>{new Date(leave.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
                    <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h3 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Request Leave</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="transition-colors"
                                style={{ color: 'var(--secondary-color)' }}
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>Start Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 rounded-lg transition-colors border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] outline-none"


                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>End Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 rounded-lg transition-colors border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] outline-none"


                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>Reason</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full p-3 rounded-lg focus:ring-2 focus:ring-gray-700 transition-colors"
                                    style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Why are you taking leave?"
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 max-sm:px-0 rounded-lg transition-colors text-white hover:opacity-80"
                                    style={{ backgroundColor: 'var(--primary-color)', border: '1px solid var(--border-color)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-gray-700 transition-colors hover:opacity-80"
                                    style={{ backgroundColor: 'var(--primary-color)', border: '1px solid var(--border-color)' }}
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorLeave;