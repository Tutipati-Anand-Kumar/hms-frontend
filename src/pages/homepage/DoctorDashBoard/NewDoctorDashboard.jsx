import React, { useState, useEffect } from "react";
import { API, getActiveUser, BASE_URL } from "../../../api/authservices/authservice";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User, FileText, ChevronRight, X } from "lucide-react";
import { FaBullhorn } from "react-icons/fa";
import DoctorScheduleCalendar from "../../../components/DoctorScheduleCalendar";

export default function NewDoctorDashboard() {
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    queue: 0
  });
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [usingBackend, setUsingBackend] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Get current doctor ID from active session
  const getDoctorId = () => {
    const user = getActiveUser();
    return user ? user.id : null;
  };

  // Fetch Doctor Profile
  const fetchDoctorProfile = async () => {
    try {
      const res = await API.get("/doctors/me");
      setDoctorProfile(res.data);
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get("/bookings/my-appointments");
      const allAppointments = Array.isArray(res.data) ? res.data : [];

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const todaysAppointments = allAppointments.filter(app => {
        if (!app.date) return false;
        // Compare YYYY-MM-DD parts only
        const appDateStr = new Date(app.date).toISOString().split('T')[0];
        return appDateStr === todayStr;
      });

      setAppointments(todaysAppointments);

      const completed = todaysAppointments.filter(app => app.status === 'completed').length;
      const cancelled = todaysAppointments.filter(app => app.status === 'cancelled').length;
      const queueCount = todaysAppointments.filter(app => app.status === 'confirmed').length;

      setStats({
        total: todaysAppointments.length,
        completed,
        cancelled,
        queue: queueCount
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      if (!silent) toast.error("Failed to fetch dashboard data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch doctor's notes - with fallback to localStorage
  const fetchDoctorNotes = async () => {
    const doctorId = getDoctorId();
    if (!doctorId) {
      console.error("No doctor ID found");
      loadNotesFromLocalStorage();
      return;
    }

    setNotesLoading(true);
    try {
      // CORRECTED ENDPOINT
      const res = await API.get(`/notes/${doctorId}`);
      const notes = Array.isArray(res.data) ? res.data : [];

      const formattedNotes = notes.map(note => ({
        id: note._id,
        text: note.text,
        timestamp: note.timestamp || note.createdAt, // Handle both
        date: new Date(note.timestamp || note.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        time: new Date(note.timestamp || note.createdAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }));

      setSavedNotes(formattedNotes);
      setUsingBackend(true);
    } catch (err) {
      console.error("Error fetching doctor notes from backend, falling back to localStorage:", err);
      setUsingBackend(false);
      loadNotesFromLocalStorage();
    } finally {
      setNotesLoading(false);
    }
  };

  // Fallback: Load notes from localStorage
  const loadNotesFromLocalStorage = () => {
    const doctorId = getDoctorId();
    const storageKey = `doctor_notes_${doctorId}`;
    const storedNotes = localStorage.getItem(storageKey);
    if (storedNotes) {
      setSavedNotes(JSON.parse(storedNotes));
    }
  };

  // Save note - try backend first, fallback to localStorage
  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    const doctorId = getDoctorId();
    if (!doctorId) {
      toast.error("Doctor not identified. Please login again.");
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      text: note.trim(),
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    // Try backend first
    if (usingBackend) {
      try {
        // CORRECTED ENDPOINT
        const res = await API.post("/notes", {
          doctorId, // backend expects doctorId in body
          text: note.trim()
        });

        // Update with backend ID
        newNote.id = res.data._id;
        newNote.timestamp = res.data.timestamp || res.data.createdAt;

        // Re-format time/date from backend timestamp to ensure consistency
        newNote.date = new Date(newNote.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        newNote.time = new Date(newNote.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        setSavedNotes(prevNotes => [newNote, ...prevNotes]);
        setNote("");
        toast.success("Note saved to cloud");
        return;
      } catch (err) {
        console.error("Error saving note to backend, falling back to localStorage:", err);
        setUsingBackend(false); // Switch to offline mode if fail
        // Continue to localStorage save
      }
    }

    // Fallback to localStorage
    const storageKey = `doctor_notes_${doctorId}`;
    const existingNotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedNotes = [newNote, ...existingNotes];

    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    setSavedNotes(updatedNotes);
    setNote("");
    toast.success("Note saved locally");
  };

  // Delete note - try backend first, fallback to localStorage
  const handleDeleteNote = async (noteId) => {
    const doctorId = getDoctorId();

    // Try backend first
    if (usingBackend) {
      try {
        // CORRECTED ENDPOINT
        await API.delete(`/notes/${noteId}`);
      } catch (err) {
        console.error("Error deleting note from backend, falling back to localStorage:", err);
        setUsingBackend(false);
      }
    }

    // Always update localStorage and state
    const storageKey = `doctor_notes_${doctorId}`;
    const updatedNotes = savedNotes.filter(note => note.id !== noteId);

    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    setSavedNotes(updatedNotes);
    setNoteToDelete(null);
    toast.success("Note deleted successfully");
  };

  const confirmDelete = (note) => {
    setNoteToDelete(note);
  };

  const cancelDelete = () => {
    setNoteToDelete(null);
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Clear all notes - try backend first, fallback to localStorage
  const handleClearAllNotes = async () => {
    if (savedNotes.length === 0) {
      toast.error("No notes to clear");
      return;
    }

    const doctorId = getDoctorId();
    if (!doctorId) {
      toast.error("Doctor not identified. Please login again.");
      return;
    }

    // Trigger Custom Modal
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    const doctorId = getDoctorId();

    // Try backend first
    if (usingBackend) {
      try {
        // CORRECTED ENDPOINT
        await API.delete(`/notes/all/${doctorId}`);
      } catch (err) {
        console.error("Error clearing notes from backend, falling back to localStorage:", err);
        setUsingBackend(false);
      }
    }

    // Always update localStorage and state
    const storageKey = `doctor_notes_${doctorId}`;
    localStorage.removeItem(storageKey);
    setSavedNotes([]);
    setShowClearConfirm(false);
    toast.success("All notes cleared");
  };

  const fetchAlertsHistory = async () => {
    try {
      // Fetch existing notifications that are emergency alerts
      const res = await API.get('/notifications');
      const alerts = res.data.filter(n => n.type === 'emergency_alert');
      setEmergencyAlerts(alerts.map(a => ({
        id: a._id, // Map ID for deletion
        message: a.message,
        senderName: "HelpDesk", // Or derive from sender if available
        timestamp: a.createdAt
      })));
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setEmergencyAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Alert removed");
    } catch (err) {
      console.error("Error deleting alert:", err);
      toast.error("Failed to delete alert");
    }
  };

  const handleClearAlertsHistory = async () => {
    try {
      await API.delete('/notifications/type/emergency');
      setEmergencyAlerts([]);
      toast.success("Emergency history cleared");
    } catch (err) {
      console.error("Error clearing history:", err);
      toast.error("Failed to clear history");
    }
  };

  const handleNextPatient = () => {
    // Filter for confirmed appointments (Queue)
    const queue = appointments.filter(app => app.status === 'confirmed');

    if (queue.length === 0) {
      toast.error("No pending patients in queue");
      return;
    }

    // Sort by startTime
    // Helper to convert "10:00 AM" to minutes
    const parseTime = (timeStr) => {
      if (!timeStr) return 9999;
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (hours === 12 && modifier === "AM") hours = 0;
      if (hours !== 12 && modifier === "PM") hours += 12;
      return hours * 60 + minutes;
    };

    const sortedQueue = [...queue].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    const nextPatient = sortedQueue[0];

    // Navigate to Prescription
    navigate("/doctor/prescription", {
      state: { appointment: nextPatient }
    });
  };

  // Handle Manual Refresh
  const handleRefresh = () => {
    fetchDashboardData(false); // Show loading spinner
    fetchDoctorNotes(); // Also refresh notes
    fetchAlertsHistory(); // And alerts
    toast.success("Dashboard refreshed");
  };

  // Load data on component mount and setup socket
  useEffect(() => {
    fetchDashboardData();
    fetchDoctorNotes();
    fetchDoctorProfile();
    fetchAlertsHistory(); // Fetch on mount

    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 10000); // 10s

    // Socket Listener for Real-time Updates
    const newSocket = io(BASE_URL, {
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("Dashboard Socket Connected:", newSocket.id);
      const user = getActiveUser();
      if (user) {
        newSocket.emit("join_room", { role: "doctor", userId: user.id });
      }
    });

    newSocket.on("appointment_status_changed", (data) => {
      console.log("Real-time update received:", data);
      fetchDashboardData(true); // Silent update on socket
    });

    newSocket.on("notification:new", (data) => {
      console.log("Notification received:", data);
      if (data.type === 'emergency_alert') {
        toast.error(data.message, { duration: 5000, icon: '🚨' });
        // Add to state immediately
        setEmergencyAlerts(prev => [{ ...data, id: data._id || Date.now(), timestamp: data.createdAt || new Date().toISOString() }, ...prev]);
      } else {
        // Optionally refresh list if it's a notification, or just show toast
        fetchAlertsHistory();
        toast(data.message);
      }
    });

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-6 max-w-md w-full border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Delete Note</h3>
            <p className="mb-4" style={{ color: 'var(--secondary-color)' }}>
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="p-3 rounded border mb-4" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--text-color)' }}>{noteToDelete.text}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--secondary-color)' }}>
                {noteToDelete.date} at {noteToDelete.time}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border rounded-md hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--secondary-color)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNote(noteToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-6 max-w-md w-full border shadow-xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-2 text-center" style={{ color: 'var(--text-color)' }}>Clear All Notes</h3>
            <p className="mb-6 text-center" style={{ color: 'var(--secondary-color)' }}>
              Are you sure you want to delete ALL notes? <br /> This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-6 py-2 border rounded-md hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--secondary-color)' }}
              >
                No, Keep Them
              </button>
              <button
                onClick={confirmClearAll}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto  pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              Welcome, {doctorProfile?.user?.name || "Doctor"}
            </h1>
            <p style={{ color: 'var(--secondary-color)' }}>
              Here's your upcoming care and quick actions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleNextPatient}
              className="px-2 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 font-bold"
            >
              <User size={16} /> Next Patient
            </button>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-2 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition-colors text-sm flex items-center gap-2 font-bold"
            >
              <FaBullhorn /> View Alerts
              {emergencyAlerts.length > 0 && (
                <span className="bg-white text-red-600 rounded-full px-2 text-xs">{emergencyAlerts.length}</span>
              )}
            </button>
            <button
              onClick={handleRefresh}
              className="px-2 py-2 border rounded-md shadow-sm hover:opacity-80 transition-colors text-sm"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments and Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Appointments */}
              <div className="rounded-xl shadow-sm border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>Today Appointments</h2>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{appointments.length} Today</span>
                </div>

                {loading ? (
                  <div className="h-40 flex justify-center items-center" style={{ color: 'var(--secondary-color)' }}>Loading...</div>
                ) : appointments.length === 0 ? (
                  <div className="h-40 flex flex-col justify-center items-center text-center p-4" style={{ color: 'var(--secondary-color)' }}>
                    <Calendar size={32} className="mb-2 opacity-50" />
                    <p>No appointments scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {appointments.map((app) => (
                      <div key={app._id} className="p-4 rounded-xl border hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-[var(--text-color)]">{app.patient?.name || "Unknown Patient"}</h3>
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${app.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              app.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--secondary-color)' }}>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(app.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{app.timeSlot}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm" style={{ color: 'var(--secondary-color)' }}>
                          <p><span className="font-semibold">Type:</span> {app.type || "General"}</p>
                          {app.reason && <p><span className="font-semibold">Reason:</span> {app.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Queue & Stats */}
              <div className="space-y-6">
                <div className="rounded-xl shadow-sm border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-color)' }}>Patient Queue</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.queue}</span>
                      <p className="text-sm mt-1" style={{ color: 'var(--secondary-color)' }}>Patients Waiting</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User size={24} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl shadow-sm border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-color)' }}>Today's Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--secondary-color)' }}>Total Appointments</span>
                      <span className="font-bold" style={{ color: 'var(--text-color)' }}>{stats.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span style={{ color: 'var(--secondary-color)' }}>Completed</span>
                      <span className="font-bold text-green-500">{stats.completed}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Notes */}
            <div className="rounded-xl shadow-sm border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-color)' }}>Quick Notes</h2>
              <textarea
                className="w-full h-24 border rounded-lg p-3 placeholder-gray-500 focus:ring-2 focus:ring-blue-600 resize-none transition-all"
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                placeholder="Type a quick note here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSaveNote();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs" style={{ color: 'var(--secondary-color)' }}>
                  Press Ctrl+Enter to save
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    onClick={() => setNote("")}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={!note.trim()}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Notes Display (WhatsApp Style) */}
          <div className="lg:col-span-1">
            <div className="rounded-xl shadow-sm border h-full flex flex-col max-h-[calc(100vh-100px)] lg:sticky lg:top-24" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              {/* Notes Header */}
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>My Notes</h2>
                </div>
                {savedNotes.length > 0 && (
                  <button
                    onClick={handleClearAllNotes}
                    className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {notesLoading ? (
                  <div className="flex flex-col items-center justify-center h-32" style={{ color: 'var(--secondary-color)' }}>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                    <p className="text-sm">Loading notes...</p>
                  </div>
                ) : savedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center" style={{ color: 'var(--secondary-color)' }}>
                    <FileText className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No notes yet</p>
                    <p className="text-xs mt-1 opacity-70">Your saved notes will appear here</p>
                  </div>
                ) : (
                  savedNotes.map((note) => (
                    <div
                      key={note.id}
                      className=" dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50 relative group transition-all hover:shadow-sm"
                    >
                      <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text-color)' }}>
                        {note.text}
                      </p>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 dark:border-blue-800/50">
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          {note.date} • {note.time}
                        </span>
                        <button
                          onClick={() => confirmDelete(note)}
                          className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete note"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t  dark:bg-gray-800/50 rounded-b-xl" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-[10px] text-center" style={{ color: 'var(--secondary-color)' }}>
                  {savedNotes.length} note{savedNotes.length !== 1 ? 's' : ''} saved • {usingBackend ? 'Cloud' : 'Local'} storage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="mt-8">
          <DoctorScheduleCalendar availability={doctorProfile?.hospitals?.[0]?.availability} />
        </div>
      </div>
      {/* Emergency Alerts Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="rounded-lg p-6 max-w-lg w-full border-2 border-red-500 shadow-2xl bg-[var(--card-bg)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <FaBullhorn /> Emergency Alerts
              </h3>
              <button onClick={() => setShowEmergencyModal(false)} className="text-[var(--secondary-color)] hover:text-[var(--text-color)]">✕</button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              {emergencyAlerts.length === 0 ? (
                <div className="text-center py-8 opacity-50" style={{ color: "var(--secondary-color)" }}>No emergency alerts received in this session.</div>
              ) : (
                emergencyAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-700 dark:text-red-400 text-sm">{alert.senderName || "HelpDesk"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-60 text-red-800 dark:text-red-300">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Remove Alert"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-red-800 dark:text-red-200">{alert.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearAlertsHistory}
                className="text-sm text-red-500 hover:underline mr-4"
              >
                Clear History
              </button>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
