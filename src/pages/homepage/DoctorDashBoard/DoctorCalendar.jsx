import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, Activity } from "lucide-react";
import { getCalendarStats, getAppointmentsByDate } from "../../../api/doctors/doctorService";
import toast from "react-hot-toast";

const DoctorCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [stats, setStats] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingApps, setLoadingApps] = useState(false);

    // Helper to get days in month
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 = Sunday

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        fetchStats();
    }, [currentDate]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await getCalendarStats(month + 1, year);
            setStats(res);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load calendar data");
        } finally {
            setLoadingStats(false);
        }
    };

    const handleDateClick = async (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setLoadingApps(true);
        try {
            const res = await getAppointmentsByDate(dateStr);
            setAppointments(res);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load appointments");
        } finally {
            setLoadingApps(false);
        }
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
        setSelectedDate(null);
        setAppointments([]);
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 rounded-lg opacity-50" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', opacity: 0.3 }}></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayStats = stats[dateStr] || {};
            const isLeave = dayStats.isLeave;
            const count = dayStats.count || 0;
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div
                    key={day}
                    onClick={() => !isLeave && handleDateClick(day)}
                    className={`h-24 p-2 rounded-lg border transition-all cursor-pointer relative overflow-hidden
            ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'hover:border-gray-600'}
            ${isLeave ? 'opacity-70 cursor-not-allowed bg-red-900/10 border-red-900/30' : ''}
            ${isToday ? 'ring-1 ring-blue-400' : ''}
          `}
                    style={{
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)',
                        borderColor: isSelected ? '#3b82f6' : 'var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : ''}`} style={{ color: isToday ? undefined : 'var(--secondary-color)' }}>{day}</span>
                        {isLeave && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Leave</span>}
                    </div>

                    {!isLeave && count > 0 && (
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                {count} Appts
                            </span>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Calendar Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="text-blue-500" />
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {loadingStats ? (
                            <div className="col-span-7 h-96 flex items-center justify-center" style={{ color: 'var(--secondary-color)' }}>Loading calendar...</div>
                        ) : renderCalendarDays()}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl h-full flex flex-col" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : "Select a Date"}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--secondary-color)' }}>
                                {selectedDate ? `${appointments.length} Appointments Scheduled` : "Click on a date to view appointments"}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loadingApps ? (
                                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
                            ) : selectedDate && appointments.length === 0 ? (
                                <div className="text-center py-10" style={{ color: 'var(--secondary-color)' }}>No appointments for this day.</div>
                            ) : (
                                appointments.map(app => (
                                    <div key={app._id} className="p-4 rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                                    {app.patient?.name?.charAt(0) || "P"}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium" style={{ color: 'var(--text-color)' }}>{app.patient?.name || "Unknown Patient"}</h4>
                                                    <p className="text-xs" style={{ color: 'var(--secondary-color)' }}>{app.type === 'online' ? 'Online Consultation' : 'In-Person Visit'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${app.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                app.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm" style={{ color: 'var(--secondary-color)' }}>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-blue-500" />
                                                <span>{new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-green-500" />
                                                <span className="truncate">{app.hospital?.name || "Hospital"}</span>
                                            </div>
                                            {app.reason && (
                                                <div className="flex items-center gap-2">
                                                    <Activity size={14} className="text-purple-500" />
                                                    <span className="truncate">{app.reason}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorCalendar;
