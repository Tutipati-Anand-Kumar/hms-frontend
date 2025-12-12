import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../../api/authservices/authservice";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import PatientMedicalSummary from "./PatientMedicalSummary";

const DashboardHome = () => {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aptRes, profileRes] = await Promise.all([
        API.get("/bookings/my-appointments"),
        API.get("/patients/profile")
      ]);
      setAppointments(aptRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get current week (Monday to Sunday)
  const getCurrentWeek = () => {
    const days = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Ensure start is Monday
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);

    // Get 7 days from Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate() &&
        apt.status !== 'cancelled'
      );
    });
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setStartDate(newDate);
  };

  const days = getCurrentWeek();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate >= today && apt.status !== 'cancelled';
  });

  const renderDayCard = (day, index) => {
    const dayAppointments = getAppointmentsForDay(day);
    const isToday = today.toDateString() === day.toDateString();
    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = day.getDate();

    return (
      <div
        key={index}
        className={` rounded-lg border-2 transition-all ${isToday
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-[var(--border-color)] bg-[var(--bg-color)]'
          } hover:border-blue-400 cursor-pointer`}
      >
        {/* Day Header */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-[var(--secondary-color)] font-medium">
            {dayName}
          </div>
          <div className={`text-2xl font-bold ${isToday ? 'text-blue-500' : 'text-[var(--text-color)]'}`}>
            {dayNumber}
          </div>
        </div>

        {/* Appointments */}
        <div className="space-y-1">
          {dayAppointments.length > 0 ? (
            <>
              {dayAppointments.slice(0, 2).map((apt, aptIndex) => (
                <div
                  key={aptIndex}
                  className="px-2 py-1 bg-red-500/20 rounded text-xs text-red-400 font-medium text-center"
                >
                  {apt.timeSlot}
                </div>
              ))}
              {dayAppointments.length > 2 && (
                <div className="text-xs text-blue-400 font-medium text-center">
                  +{dayAppointments.length - 2} more
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-center text-[var(--secondary-color)] italic">
              No events
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get month and year for header
  const currentMonth = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="md:p-6 lg:p-8 min-h-screen max-sm:w-full bg-[var(--bg-color)] text-[var(--text-color)]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-color)] max-sm:text-2xl">Welcome, {profile?.user?.name || "Patient"}</h1>
          <p className="text-[var(--secondary-color)] text-sm sm:text-base">
            Here's your upcoming care and quick actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-2  max-sm:mt-0">
          <button
            onClick={() => navigate("appointments")}
            className="px-4 py-2 max-sm:text-[14px] max-sm:h-10 bg-blue-600 text-white max-sm:px-1 max-sm:py-0 rounded-lg hover:bg-blue-700 shadow flex-1 sm:flex-none"
          >
            Book Appointment
          </button>
          <button
            onClick={() => navigate("aisymptomchecker")}
            className="px-4 py-2  max-sm:text-[14px] max-sm:h-10 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--border-color)] shadow text-[var(--text-color)] flex-1 sm:flex-none"
          >
            Symptom Check
          </button>
        </div>
      </div>

      {/* GRID WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UPCOMING APPOINTMENTS */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-3 rounded-xl shadow border border-[var(--border-color)]">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-color)]">Upcoming Appointments</h2>

          {upcoming.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-[var(--secondary-color)]">
              <p>No upcoming appointments</p>
              <p className="text-sm mt-2">Total appointments: {appointments.length}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcoming.map((apt) => (
                <div
                  key={apt._id}
                  className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]"
                >
                  <p className="font-semibold text-[var(--text-color)]">{apt.doctor?.user?.name}</p>
                  <p className="text-[var(--secondary-color)] text-sm">
                    Date: {new Date(apt.date).toLocaleDateString()} | Time: {apt.timeSlot}
                  </p>
                  <p className="text-[var(--secondary-color)] text-sm">Reason: {apt.reason}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${apt.status === 'confirmed' ? 'bg-green-900 text-green-300' :
                    apt.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-300'
                    }`}>
                    {apt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEEKLY CALENDAR - RIGHT SIDEBAR */}
        <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow border border-[var(--border-color)]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" />
              <h2 className="text-base font-bold text-[var(--text-color)]">{currentMonth}</h2>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-1 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-1 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Responsive 7-Day Grid */}
          <div className="grid grid-cols-3 md:grid-cols-7 lg:grid-cols-3 gap-2">
            {days.map((day, index) => renderDayCard(day, index))}
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-6">
        {/* QUICK ACTIONS */}
        <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow border border-[var(--border-color)]">
          <h3 className="font-semibold mb-4 text-[var(--text-color)]">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("records")}
              className="w-full py-2 bg-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--secondary-color)] hover:text-white transition-colors"
            >
              View Records
            </button>

            <button
              onClick={() => navigate("/home/patient/profile/edit")}
              className="w-full py-2 bg-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--secondary-color)] hover:text-white transition-colors"
            >
              Edit Profile
            </button>

            <button
              onClick={() => navigate("prescriptions")}
              className="w-full py-2 bg-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--secondary-color)] hover:text-white transition-colors"
            >
              View Prescriptions
            </button>
          </div>
        </div>

        {/* NEXT STEPS */}
        <PatientMedicalSummary />

        {/* SUPPORT */}
        <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow border border-[var(--border-color)]">
          <h3 className="font-semibold mb-2 text-[var(--text-color)]">Support</h3>
          <p className="text-[var(--secondary-color)] text-sm">
            Contact the clinic or check messages for updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;