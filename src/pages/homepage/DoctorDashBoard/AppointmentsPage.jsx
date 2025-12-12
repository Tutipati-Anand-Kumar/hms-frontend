import React, { useEffect, useState } from "react";
import { API } from "../../../api/authservices/authservice";
import { FaPlay, FaTimes, FaBan } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import io from "socket.io-client";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchAppointments();

    // Initialize Socket
    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchAppointments = async () => {
    try {
      const res = await API.get("/bookings/my-appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (!selectedDate) return true;
    const appDate = new Date(app.date).toISOString().split("T")[0];
    return appDate === selectedDate;
  });

  const handleStartAppointment = (appointment) => {
    const now = new Date();
    const apptDate = new Date(appointment.date);
    const [startTime] = appointment.timeSlot.split(" - ");
    const [hours, minutes] = startTime.split(":").map(Number); // Assuming 24h format or handle AM/PM

    // Adjust apptDate with time
    apptDate.setHours(hours, minutes, 0, 0);

    // Allow starting 10 mins before
    const allowTime = new Date(apptDate.getTime() - 10 * 60000);

    if (now < allowTime) {
      toast.error(`Cannot start yet. Please wait until ${allowTime.toLocaleTimeString()}`);
      return;
    }

    navigate("/doctor/prescription", { state: { appointment } });
  };

  // ... inside component ...
  const [cancelModalApptId, setCancelModalApptId] = useState(null);

  // ... existing functions ...

  const handleCancelAppointment = (id) => {
    // Open modal
    setCancelModalApptId(id);
  };

  const proceedCancel = async () => {
    if (!cancelModalApptId) return;

    try {
      const reason = "The doctor cancelled your appointment due to some emergency issues and other etc problems. Please choose another schedule for this appointment.";

      await API.patch(`/bookings/${cancelModalApptId}/status`, {
        status: "cancelled",
        reason: reason
      });

      toast.success("Appointment cancelled");
      fetchAppointments();

      if (socket) {
        socket.emit("doctor_cancelled_appointment", { appointmentId: cancelModalApptId });
      }

    } catch (err) {
      console.error("Cancel Error:", err);
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelModalApptId(null);
    }
  };

  return (
    <div className="h-full" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* ... header ... */}
      <div className="p-5 rounded-xl shadow flex justify-between items-center mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-xl  max-sm:text-[16px] font-semibold" style={{ color: 'var(--text-color)' }}>My Appointments</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 rounded border bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--border-color)]"
        />
      </div>

      {loading ? (
        <div className="text-center p-8" style={{ color: 'var(--text-color)' }}>Loading...</div>
      ) : appointments.length === 0 ? (
        <div className="p-8 rounded-xl shadow text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--secondary-color)' }}>
          No appointments found.
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No appointments for this date.</div>
          ) : (
            filteredAppointments.map((app) => (
              <div key={app._id} className="p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>{app.patient?.name}</h3>
                    <span className={`text-sm font-bold uppercase ${app.status === 'confirmed' ? 'text-green-600' :
                        app.status === 'pending' ? 'text-yellow-600' :
                          app.status === 'cancelled' ? 'text-red-600' :
                            app.status === 'completed' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      {app.status}
                    </span>
                    {app.urgency && (
                      <span className={`text-xs font-bold uppercase ml-2 ${app.urgency === 'urgent' || app.urgency === 'Emergency' ? 'text-red-600 animate-pulse' : 'text-blue-500'
                        }`}>
                        {app.urgency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>
                    {new Date(app.date).toLocaleDateString()} at {app.timeSlot}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--secondary-color)' }}>Reason: {app.reason}</p>
                  {app.symptoms && app.symptoms.length > 0 && (
                    <p className="text-xs" style={{ color: 'var(--secondary-color)' }}>Symptoms: {app.symptoms.join(", ")}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  {(app.status === 'confirmed' || app.status === 'in-progress') && (
                    <>
                      <button
                        onClick={() => handleStartAppointment(app)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
                      >
                        <FaPlay size={12} /> Start
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(app._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition"
                      >
                        <FaBan size={12} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalApptId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
          <div
            className="p-6 rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--text-color)' }}>Confirm Cancellation</h3>
            <p className="mb-6 text-center" style={{ color: 'var(--secondary-color)' }}>
              Are you sure you want to cancel this appointment?
              <br />
              <span className="text-xs opacity-70">(A notification will be sent to the patient)</span>
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={proceedCancel}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setCancelModalApptId(null)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                No, Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
