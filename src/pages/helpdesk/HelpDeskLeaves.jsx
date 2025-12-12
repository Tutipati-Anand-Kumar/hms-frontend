import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Calendar, CheckCircle, XCircle, Clock, Check, X } from "lucide-react";
import { API } from "../../api/authservices/authservice";

const HelpDeskLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const res = await API.get("/leaves");
            setLeaves(res.data);
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error("Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await API.patch(`/leaves/${id}/status`, { status });
            toast.success(`Leave request ${status}`);
            fetchLeaves();
        } catch (error) {
            console.error("Error updating leave status:", error);
            toast.error("Failed to update status");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved": return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700";
            case "rejected": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700";
            default: return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved": return <CheckCircle className="w-4 h-4" />;
            case "rejected": return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6 h-full" style={{ backgroundColor: 'var(--bg-color)' }}>
            <h1 className="text-2xl font-bold max-sm:text-lg" style={{ color: 'var(--text-color)' }}>Doctor Leave Requests</h1>

            <div className="rounded-xl shadow-lg border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                {loading ? (
                    <div className="p-8 text-center" style={{ color: 'var(--secondary-color)' }}>Loading...</div>
                ) : leaves.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--secondary-color)' }}>No leave requests found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm border-b" style={{ color: 'var(--secondary-color)', borderColor: 'var(--border-color)' }}>
                                <tr>
                                    <th className="p-4 font-medium">Doctor</th>
                                    <th className="p-4 font-medium">Start Date</th>
                                    <th className="p-4 font-medium">End Date</th>
                                    <th className="p-4 font-medium">Reason</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                {leaves.map((leave) => (
                                    <tr key={leave._id} className="dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 font-medium" style={{ color: 'var(--text-color)' }}>
                                            {leave.doctorId?.name || "Unknown Doctor"}
                                        </td>
                                        <td className="p-4" style={{ color: 'var(--text-color)' }}>{new Date(leave.startDate).toLocaleDateString()}</td>
                                        <td className="p-4" style={{ color: 'var(--text-color)' }}>{new Date(leave.endDate).toLocaleDateString()}</td>
                                        <td className="p-4 max-w-xs truncate" style={{ color: 'var(--secondary-color)' }} title={leave.reason}>
                                            {leave.reason}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                                                {getStatusIcon(leave.status)}
                                                <span className="ml-1">{leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}</span>
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {leave.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, "approved")}
                                                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-300 dark:border-green-700 hover:border-green-500"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, "rejected")}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-300 dark:border-red-700 hover:border-red-500"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpDeskLeaves;