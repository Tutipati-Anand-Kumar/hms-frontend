import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API } from "../../api/authservices/authservice";
import {
    FaCheck,
    FaTimes,
    FaCalendarAlt,
    FaClock,
    FaUser,
    FaPhone,
    FaStethoscope,
    FaExclamationTriangle
} from "react-icons/fa";
import toast from "react-hot-toast";

const HelpDeskAppointments = () => {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hospitalId, setHospitalId] = useState(null);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedApptId, setSelectedApptId] = useState(null);

    useEffect(() => {
        fetchHospitalId();

        // SOCKET CONNECTION MERGED (both versions matched)
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const socketUrl = apiUrl.replace("/api", "");
        const socket = io(socketUrl, { transports: ["websocket"] });

        socket.on("connect", () => {
            console.log("Helpdesk Socket Connected");
        });

        socket.on("appointment:new", () => {
            toast.success("New appointment request received!");
            if (hospitalId) fetchStats(hospitalId);
        });

        socket.on("appointment:status_change", () => {
            if (hospitalId) fetchStats(hospitalId);
        });

        socket.on("appointment_status_changed", () => {
            if (hospitalId) fetchStats(hospitalId);
        });

        return () => socket.disconnect();
    }, [hospitalId]);

    useEffect(() => {
        if (hospitalId) fetchStats(hospitalId);
    }, [hospitalId, date]);

    const fetchHospitalId = async () => {
        try {
            const res = await API.get("/helpdesk/profile/me");
            const hosp = res.data.hospital;

            if (hosp) {
                const hospId = hosp._id || hosp;
                setHospitalId(typeof hospId === "string" ? hospId.trim() : hospId);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };

    const fetchStats = async (id) => {
        setLoading(true);
        try {
            const res = await API.get(`/bookings/hospital-stats?hospitalId=${id}&date=${date}`);
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
            toast.error("Failed to load appointment stats.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, reason = null) => {
        try {
            const payload = { status };
            if (reason) payload.reason = reason;

            await API.put(`/bookings/status/${id}`, payload);

            toast.success(
                `Appointment ${status === "rejected" ? "rejected" : "confirmed"} successfully`
            );

            if (hospitalId) fetchStats(hospitalId);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update appointment");
        }
    };

    const openRejectModal = (id) => {
        setSelectedApptId(id);
        setRejectReason("");
        setShowRejectModal(true);
    };

    const submitRejection = () => {
        if (!rejectReason.trim()) {
            toast.error("Please enter a reason for rejection");
            return;
        }
        handleStatusUpdate(selectedApptId, "rejected", rejectReason);
        setShowRejectModal(false);
    };

    const formatHour = (h) => {
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${h12} ${ampm}`;
    };

    return (
        <div className="h-full" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-blue-500 max-sm:text-[18px]">Manage Appointments</h1>

                <div className="flex items-center gap-2 bg-[var(--card-bg)] p-2 rounded border border-[var(--border-color)]">
                    <FaCalendarAlt className="text-[var(--secondary-color)]" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-[var(--text-color)]"
                    />
                </div>
            </div>

            {/* LOADING STATE */}
            {loading ? (
                <div className="p-8 text-center opacity-70">Loading appointments...</div>
            ) : (
                <div className="space-y-6">
                    {stats.filter((h) => h.count > 0).length === 0 ? (
                        <div className="text-center p-10 opacity-60 border rounded-lg border-dashed border-[var(--border-color)]">
                            No appointments found for this date.
                        </div>
                    ) : (
                        stats.map(
                            (hourStat) =>
                                hourStat.count > 0 && (
                                    <div
                                        key={hourStat.hour}
                                        className="rounded-lg border overflow-hidden shadow-sm"
                                        style={{
                                            backgroundColor: "var(--card-bg)",
                                            borderColor: "var(--border-color)"
                                        }}
                                    >
                                        {/* Hour Block Header */}
                                        <div
                                            className="p-4 bg-blue-500/5 border-b flex justify-between items-center"
                                            style={{ borderColor: "var(--border-color)" }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FaClock className="text-blue-500" />
                                                <h3 className="font-bold text-lg">
                                                    {formatHour(hourStat.hour)} – {formatHour(hourStat.hour + 1)}
                                                </h3>
                                            </div>

                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                                {hourStat.count} Patient{hourStat.count > 1 ? "s" : ""}
                                            </span>
                                        </div>

                                        {/* Appointment List */}
                                        <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                                            {hourStat.appointments.map((app) => (
                                                <div
                                                    key={app._id}
                                                    className="p-4 hover:bg-[var(--bg-color)] transition-colors"
                                                >
                                                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                                                        {/* Patient Details */}
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-lg">{app.patient.name}</h4>

                                                                {app.urgency?.includes("Emergency") && (
                                                                    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold animate-pulse">
                                                                        <FaExclamationTriangle /> EMERGENCY
                                                                    </span>
                                                                )}

                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded font-medium ${app.status === "confirmed"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : app.status === "cancelled"
                                                                            ? "bg-red-100 text-red-700"
                                                                            : "bg-yellow-100 text-yellow-700"
                                                                        }`}
                                                                >
                                                                    {app.status.toUpperCase()}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm opacity-80">
                                                                <p className="flex items-center gap-2">
                                                                    <FaPhone className="text-[var(--secondary-color)]" />
                                                                    {app.patient.mobile}
                                                                </p>

                                                                <p className="flex items-center gap-2">
                                                                    <FaUser className="text-[var(--secondary-color)]" />
                                                                    {app.patient?.age || app.patientDetails?.age || 'N/A'} Y / {app.patient?.gender || app.patientDetails?.gender || 'N/A'}
                                                                </p>

                                                                <p className="flex items-center gap-2">
                                                                    <FaStethoscope className="text-[var(--secondary-color)]" />
                                                                    {app.doctorName}
                                                                </p>

                                                                <p className="flex items-center gap-2">
                                                                    <FaClock className="text-[var(--secondary-color)]" />
                                                                    {app.timeSlot}
                                                                </p>
                                                            </div>

                                                            {app.reason && (
                                                                <p className="text-sm mt-2 p-2 bg-[var(--bg-color)] rounded border border-[var(--border-color)] italic">
                                                                    {app.reason.replace(/^"|"$/g, '')}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* ACTION BUTTONS */}
                                                        <div className="flex items-center gap-2">
                                                            {app.status === "pending" && (
                                                                <>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleStatusUpdate(app._id, "confirmed")
                                                                        }
                                                                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition shadow-sm"
                                                                    >
                                                                        <FaCheck /> Confirm
                                                                    </button>

                                                                    <button
                                                                        onClick={() => openRejectModal(app._id)}
                                                                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition shadow-sm"
                                                                    >
                                                                        <FaTimes /> Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                        )
                    )}
                </div>
            )
            }

            {/* REJECT MODAL */}
            {
                showRejectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-xl w-96 border border-[var(--border-color)]">
                            <h3 className="text-xl font-bold mb-4">Reject Appointment</h3>
                            <p className="mb-2 text-[var(--secondary-color)]">
                                Please enter a reason for rejection:
                            </p>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-2 border rounded mb-4 bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--border-color)]"
                                rows="3"
                                placeholder="Reason..."
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={submitRejection}
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default HelpDeskAppointments;
