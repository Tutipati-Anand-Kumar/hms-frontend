import { useEffect, useState } from "react";
import DoctorScheduleCalendar from "../../components/DoctorScheduleCalendar";
import { getActiveUser, API } from "../../api/authservices/authservice";
import Chart from "react-apexcharts";
import toast from "react-hot-toast";
import { FaBullhorn, FaStickyNote, FaTrash, FaPlus, FaUserMd, FaHospital, FaStar, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import ConfirmationModal from "../../components/CofirmationModel";

const HelpDeskDashboard = () => {
    const [hospital, setHospital] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const user = getActiveUser();

    // Stats State
    const [statsDate, setStatsDate] = useState(new Date().toISOString().split("T")[0]);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [topDoctors, setTopDoctors] = useState([]);
    const [todayCount, setTodayCount] = useState(0);

    const fetchHospitalDetails = async () => {
        try {
            const res = await API.get("/helpdesk/profile/me");
            const helpDesk = res.data;

            if (helpDesk.hospital) {
                const hospId = helpDesk.hospital._id || helpDesk.hospital;
                const finalId = typeof hospId === "string" ? hospId.trim() : hospId;

                if (finalId) {
                    const hospRes = await API.get(`/hospitals/${finalId}`);
                    setHospital(hospRes.data);
                }
            }
        } catch (err) {
            console.error("Error fetching hospital details:", err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await API.get("/doctors");
            const hospitalDoctors = res.data.filter((doc) =>
                doc.hospitals &&
                doc.hospitals.some(
                    (h) =>
                        (typeof h.hospital === "string"
                            ? h.hospital
                            : h.hospital._id) === hospital._id
                )
            );
            setDoctors(hospitalDoctors);
        } catch (err) {
            console.error("Error fetching doctors:", err);
        }
    };

    const fetchStats = async () => {
        if (!hospital?._id) return;
        try {
            // Fetch WEEKLY stats which gives us daily breakdown + aggregated top doctors
            const res = await API.get(
                `/bookings/hospital-stats?hospitalId=${hospital._id}&date=${statsDate}&range=week`
            );

            if (res.data.period === 'week') {
                setWeeklyStats(res.data.dailyStats || []);
                setTopDoctors(res.data.topDoctors || []);

                // Find count for the SELECTED date from the daily stats array
                // The API returns dailyStats for the week ending on 'statsDate'
                const targetDate = statsDate;
                const targetStat = res.data.dailyStats.find(d => d.date === targetDate);

                // If found, use it. If not found (shouldn't happen if API aligns), default to 0.
                setTodayCount(targetStat ? targetStat.count : 0);
            }
        } catch (err) {
            console.error("Error loading stats:", err);
        }
    };

    useEffect(() => {
        fetchHospitalDetails();
    }, []);

    useEffect(() => {
        if (hospital) {
            fetchDoctors();
            fetchStats();
        }
    }, [hospital, statsDate]);

    return (
        <div className="h-full bg-[var(--bg-color)]" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl max-sm:text-sm font-bold">Help Desk Dashboard</h1>
                {hospital && <EmergencyButton hospitalId={hospital._id} />}
            </div>

            {/* Hospital Details Card */}
            <div
                className="p-6 rounded-lg shadow-lg mb-6 border"
                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
            >
                <div>
                    <h2 className="text-sm font-semibold mb-2">
                        Welcome, {user?.name || "HelpDesk"} - {hospital?.name || "Hospital Staff"}
                    </h2>
                </div>

                {hospital && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm"
                        style={{ borderColor: "var(--border-color)", color: "var(--secondary-color)" }}>

                        <div className="flex items-start gap-2">
                            <FaMapMarkerAlt className="mt-1 text-blue-500" />
                            <div>
                                <p className="font-semibold text-[var(--text-color)]">Address</p>
                                <p>{hospital.address}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <FaPhone className="mt-1 text-green-500" />
                            <div>
                                <p className="font-semibold text-[var(--text-color)]">Contact</p>
                                <p>{hospital.phone}</p>
                                <p>{hospital.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <FaStar className="mt-1 text-yellow-500" />
                            <div>
                                <p className="font-semibold text-[var(--text-color)]">Rating</p>
                                <p>{hospital.rating} / 5.0</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <FaHospital className="mt-1 text-purple-500" />
                            <div>
                                <p className="font-semibold text-[var(--text-color)]">Established</p>
                                <p>{hospital.establishedYear}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4-Column Stats Row */}
            {/* 3-Column Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

                {/* 1. Patient Volume (Today) */}
                <div className="p-4 rounded-lg shadow-lg border h-64 flex flex-col"
                    style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium opacity-70">Patient Volume</h3>
                        <input
                            type="date"
                            value={statsDate}
                            onChange={(e) => setStatsDate(e.target.value)}
                            className="p-1 rounded border bg-transparent text-[10px] w-24 outline-none"
                            style={{ borderColor: "var(--border-color)" }}
                        />
                    </div>
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Overlay Count explicitly for 100% visibility */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex flex-col items-center mt-2">
                                <span className="text-2xl font-bold text-blue-500">{todayCount}</span>
                                <span className="text-xs text-gray-400">Volume</span>
                            </div>
                        </div>

                        <Chart
                            options={{
                                chart: { type: "radialBar", height: 180, background: "transparent" },
                                plotOptions: {
                                    radialBar: {
                                        hollow: { size: "65%" },
                                        dataLabels: {
                                            name: { show: false },
                                            value: { show: false }, // Hiding chart's internal labels to use our custom overlay
                                            total: { show: false }
                                        }
                                    }
                                },
                                fill: { colors: ["#3b82f6"] },
                                labels: ["Volume"],
                                theme: { mode: 'dark' }
                            }}
                            series={[todayCount > 0 ? 100 : 0]}
                            type="radialBar"
                            height={200}
                        />
                    </div>
                </div>

                {/* 2. Weekly Trend (Line Chart) */}
                <div className="p-4 rounded-lg shadow-lg border h-64 flex flex-col"
                    style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
                    <h3 className="text-sm font-medium opacity-70 mb-2">Weekly Trend (7 Days)</h3>
                    <div className="flex-1 flex items-center justify-center w-full">
                        <Chart
                            options={{
                                chart: { type: "area", height: 180, toolbar: { show: false }, background: "transparent" },
                                dataLabels: { enabled: false },
                                stroke: { curve: 'smooth', width: 2 },
                                xaxis: {
                                    categories: weeklyStats.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })),
                                    labels: { style: { colors: 'var(--secondary-color)', fontSize: '10px' } },
                                    axisBorder: { show: false },
                                    axisTicks: { show: false }
                                },
                                yaxis: { show: false },
                                grid: { show: false },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
                                colors: ['#10b981'],
                                theme: { mode: 'light' },
                                tooltip: { theme: 'dark', x: { show: true } }
                            }}
                            series={[{ name: "Patients", data: weeklyStats.map(d => d.count) }]}
                            type="area"
                            height="180"
                            width="100%"
                        />
                    </div>
                </div>

                {/* 3. Top Doctors (Weekly) */}
                <div className="p-4 rounded-lg shadow-lg border h-64 flex flex-col"
                    style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
                    <h3 className="text-sm font-medium opacity-70 mb-2">Top Doctors (Weekly)</h3>
                    <div className="flex-1 flex items-center justify-center w-full">
                        {topDoctors.length > 0 ? (
                            <div className="w-full">
                                <Chart
                                    options={{
                                        chart: { type: "bar", height: 180, toolbar: { show: false }, background: "transparent" },
                                        plotOptions: {
                                            bar: { horizontal: true, barHeight: '50%', distributed: true, borderRadius: 4, dataLabels: { position: 'bottom' } }
                                        },
                                        dataLabels: {
                                            enabled: true, textAnchor: 'start',
                                            style: { colors: ['#fff'], fontSize: '10px', fontWeight: 'bold' },
                                            formatter: (val, opt) => opt.w.globals.labels[opt.dataPointIndex] + " (" + val + ")",
                                            offsetX: 0, dropShadow: { enabled: true }
                                        },
                                        xaxis: { categories: topDoctors.map(d => d.name), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                                        yaxis: { labels: { show: false } },
                                        grid: { show: false },
                                        tooltip: { theme: 'dark', y: { formatter: (val) => val + " Patients" } },
                                        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                                        theme: { mode: 'light' }
                                    }}
                                    series={[{ name: "Patients", data: topDoctors.map(d => d.count) }]}
                                    type="bar"
                                    height="180"
                                    width="100%"
                                />
                            </div>
                        ) : (
                            <div className="text-center opacity-50 text-xs">No data for this week</div>
                        )}
                    </div>
                </div>



            </div>



            {/* Bottom Row: Doctor Schedules + My Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Doctor Schedules - Takes up 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className="p-6 rounded-lg shadow-lg border h-[100%]"
                        style={{
                            backgroundColor: "var(--card-bg)",
                            borderColor: "var(--border-color)",
                        }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2 max-sm:text-[12px]">
                                <FaUserMd /> Doctor Schedules
                            </h2>

                            <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                                Total Doctors: {doctors.length}
                            </span>
                        </div>

                        {selectedDoctor ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium text-lg">
                                        {selectedDoctor.user?.name}'s Schedule
                                    </h3>
                                    <button
                                        onClick={() => setSelectedDoctor(null)}
                                        className="text-sm text-blue-500 hover:underline"
                                    >
                                        Back to list
                                    </button>
                                </div>

                                <DoctorScheduleCalendar doctorId={selectedDoctor.user._id} />
                            </div>
                        ) : (
                            <div>
                                <p
                                    className="mb-4 text-sm"
                                    style={{ color: "var(--secondary-color)" }}
                                >
                                    Select a doctor to view their weekly schedule.
                                </p>

                                {doctors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {doctors.map((doc) => (
                                            <div
                                                key={doc._id}
                                                onClick={() => setSelectedDoctor(doc)}
                                                className="p-4 rounded border cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
                                                style={{
                                                    backgroundColor: "var(--bg-color)",
                                                    borderColor: "var(--border-color)",
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {doc.user?.name?.charAt(0) || "D"}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{doc.user?.name}</p>
                                                    <p className="text-xs opacity-70">
                                                        {doc.specialties?.join(", ")}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm opacity-70">
                                        No doctors found for this hospital.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* My Notes (Takes up 1 col) */}
                <div className="h-full">
                    <NotesSection userId={user?._id || user?.id} />
                </div>
            </div>
        </div>
    );
};

/* =============================
   Emergency Button Component
   ============================= */
const EmergencyButton = ({ hospitalId }) => {
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("Emergency case reported. Please prioritize.");
    const [loading, setLoading] = useState(false);

    const handleSendAlert = async () => {
        if (!message.trim()) return;
        setLoading(true);
        try {
            await API.post("/notifications/emergency", {
                hospitalId,
                message
            });
            toast.success("Emergency alert sent to all doctors!");
            setShowModal(false);
        } catch (err) {
            console.error("Emergency Alert Error:", err);
            toast.error("Failed to send alert");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 max-sm:px-1 max-sm:text-[10px] rounded-lg flex items-center gap-2 font-bold shadow-lg animate-pulse"
            >
                <FaBullhorn /> EMERGENCY ALERT
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl w-full max-w-md p-6 border-2 border-red-500">
                        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                            <FaBullhorn /> Broadcast Emergency
                        </h3>
                        <p className="mb-4 text-sm opacity-80" style={{ color: "var(--text-color)" }}>
                            This will send an immediate alert to all doctors in the hospital to prioritize this case.
                        </p>

                        <textarea
                            className="w-full p-3 border rounded-lg mb-4 bg-transparent"
                            rows="3"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the emergency..."
                            style={{
                                borderColor: "var(--border-color)",
                                color: "var(--text-color)",
                                backgroundColor: "var(--bg-color)"
                            }}
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] hover:opacity-80"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendAlert}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Alert"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/* =============================
   Notes Section Component (Matched to Doctor Dashboard Style)
   ============================= */
const NotesSection = ({ userId }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
        action: null
    });

    const fetchNotes = async () => {
        if (!userId) return;
        try {
            const res = await API.get(`/notes/${userId}`);
            setNotes(res.data);
        } catch (err) {
            console.error("Error fetching notes:", err);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [userId]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await API.post("/notes", { doctorId: userId, text: newNote });
            setNewNote("");
            fetchNotes();
            toast.success("Note added");
        } catch (err) {
            toast.error("Failed to add note");
        }
    };

    const handleDeleteNote = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Note",
            message: "Are you sure you want to delete this note?",
            confirmText: "Delete",
            type: "danger",
            action: async () => {
                try {
                    await API.delete(`/notes/${id}`);
                    setNotes(notes.filter(n => n._id !== id));
                    toast.success("Note deleted");
                    closeModal();
                } catch (err) {
                    toast.error("Failed to delete note");
                }
            }
        });
    };

    const handleClearAll = () => {
        setConfirmModal({
            isOpen: true,
            title: "Delete All Notes",
            message: "Are you sure you want to delete all notes? This action cannot be undone.",
            confirmText: "Delete All",
            type: "danger",
            action: async () => {
                try {
                    // Assuming a bulk delete endpoint or iterating for now
                    await Promise.all(notes.map(note => API.delete(`/notes/${note._id}`)));
                    setNotes([]);
                    toast.success("All notes cleared");
                    closeModal();
                } catch (err) {
                    console.error("Error clearing all notes:", err);
                    toast.error("Failed to clear all notes");
                }
            }
        });
    };

    const closeModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

    return (
        <div className="rounded-lg shadow-lg border flex flex-col h-full max-h-[400px]" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold flex items-center gap-2">
                    <FaStickyNote className="text-yellow-500" /> My Notes
                </h3>

            </div>

            {/* Quick Note Input Area */}
            <div className="p-4 flex flex-col gap-2 rounded-md mx-4 mt-4" style={{ backgroundColor: "var(--bg-color)" }}>
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type a quick note..."
                    className="w-full p-2 rounded border bg-transparent text-sm resize-none"
                    rows="2"
                    style={{ borderColor: "var(--border-color)" }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleAddNote();
                        }
                    }}
                />
                <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="self-end px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    Save Note
                </button>
            </div>

            {/* Note List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {notes.length === 0 ? (
                    <div className="text-center opacity-50 text-sm py-4">No notes yet.</div>
                ) : (
                    notes.map(note => (
                        <div key={note._id} className="p-3 rounded border relative group"
                            style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)"
                            }}>
                            <p className="text-sm whitespace-pre-wrap pr-6">{note.text}</p>
                            <span className="text-[10px] opacity-60 block mt-2">
                                {new Date(note.timestamp).toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => handleDeleteNote(note._id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>
            {notes.length > 0 && (
                <div className="p-2 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
                    <button onClick={handleClearAll} className="text-xs text-red-500 hover:underline">Clear All Notes</button>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeModal}
                onConfirm={confirmModal.action}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                type={confirmModal.type}
            />
        </div>
    );
};

/* =============================
   HospitalDailyStats Component (Splittable)
   ============================= */
const HospitalDailyStats = ({ hospitalId, mode }) => {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [topDoctors, setTopDoctors] = useState([]);

    const fetchStats = async () => {
        if (!hospitalId) return;
        setLoading(true);

        try {
            const res = await API.get(
                `/bookings/hospital-stats?hospitalId=${hospitalId}&date=${date}`
            );
            setStats(res.data);
            processTopDoctors(res.data);
        } catch (err) {
            console.error("Error loading stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const processTopDoctors = (hourlyStats) => {
        const docCounts = {};

        hourlyStats.forEach(hour => {
            hour.appointments.forEach(app => {
                const docName = app.doctorName || "Unknown";
                docCounts[docName] = (docCounts[docName] || 0) + 1;
            });
        });

        const sortedDocs = Object.entries(docCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setTopDoctors(sortedDocs);
    };

    useEffect(() => {
        fetchStats();
    }, [hospitalId, date]);

    const totalPatients = stats.reduce((acc, curr) => acc + curr.count, 0);

    const radialOptions = {
        chart: { type: "radialBar", height: 180, background: "transparent" },
        plotOptions: {
            radialBar: {
                hollow: { size: "60%" },
                dataLabels: {
                    name: { show: true, fontSize: '14px', color: 'var(--secondary-color)', offsetY: 5 },
                    value: {
                        show: true,
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        offsetY: -10,
                        formatter: function (val) { return totalPatients }
                    },
                    total: {
                        show: true,
                        label: 'Total',
                        color: 'var(--text-color)',
                        formatter: function () { return totalPatients }
                    }
                }
            }
        },
        fill: { colors: ["#3b82f6"] },
        stroke: { lineCap: "round" },
        labels: ["Patients"],
        theme: { mode: 'dark' }
    };

    // Horizontal Bar Chart
    const barOptions = {
        chart: { type: "bar", height: 200, toolbar: { show: false }, background: "transparent" },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '50%', // Thinner bars to look more like boxes
                distributed: true,
                borderRadius: 4,
                dataLabels: { position: 'bottom' }, // labels inside
            }
        },
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: ['#fff'],
                fontSize: '12px',
                fontWeight: 'bold'
            },
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] + " (" + val + ")"
            },
            offsetX: 0,
            dropShadow: { enabled: true }
        },
        xaxis: {
            categories: topDoctors.map(d => d.name),
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { labels: { show: false } },
        grid: { show: false },
        tooltip: { theme: 'dark', y: { formatter: function (val) { return val + " Patients" } } },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        theme: { mode: 'light' }
    };

    if (mode === "volume_only") {
        return (
            <div
                className="p-4 rounded-lg shadow-lg border h-full flex flex-col"
                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium opacity-70">Patient Volume</h3>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-1 rounded border bg-transparent text-[10px] w-24 outline-none"
                        style={{ borderColor: "var(--border-color)" }}
                    />
                </div>

                <div className="flex-1 flex items-center justify-center min-h-[150px]">
                    <Chart
                        options={radialOptions}
                        series={[totalPatients > 0 ? 100 : 0]}
                        type="radialBar"
                        height={180}
                    />
                </div>
            </div>
        );
    }

    if (mode === "doctors_only") {
        return (
            <div
                className="p-4 rounded-lg shadow-lg border h-full flex flex-col"
                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
            >
                <h3 className="text-sm font-medium opacity-70 mb-2">Top Specialized Doctors</h3>

                <div className="flex-1 min-h-[150px] flex items-center justify-center">
                    {topDoctors.length > 0 ? (
                        <div className="w-full">
                            <Chart
                                options={barOptions}
                                series={[{ name: "Patients", data: topDoctors.map(d => d.count) }]}
                                type="bar"
                                height={180}
                            />
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm opacity-50">No data available</p>
                            <p className="text-[10px] opacity-40">Appointments will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default HelpDeskDashboard;