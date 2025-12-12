import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader } from 'lucide-react';
import { API } from '../api/authservices/authservice';
import { io } from 'socket.io-client';

const DoctorScheduleCalendar = ({ doctorId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const fetchCalendarData = useCallback(async () => {
        try {
            setLoading(true);

            const res = await API.get('/doctors/calendar/stats', {
                params: {
                    view: 'weekly',
                    startDate: formatDate(currentDate),
                    doctorId: doctorId
                }
            });

            setCalendarData(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching calendar stats:", err);
            setError("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    }, [currentDate, doctorId]);

    // --- SOCKET + API FETCH (BOTH VERSIONS WERE SAME → KEEP ONCE) ---
    useEffect(() => {
        fetchCalendarData();

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const socketUrl = apiUrl.replace("/api", "");
        const socket = io(socketUrl, { transports: ["websocket"] });

        socket.on("appointment:new", fetchCalendarData);
        socket.on("appointment:status_change", fetchCalendarData);
        socket.on("appointment_status_changed", fetchCalendarData);

        return () => socket.disconnect();
    }, [fetchCalendarData]);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleToday = () => setCurrentDate(new Date());

    // LOADING
    if (loading && !calendarData) {
        return (
            <div className="w-full h-64 flex justify-center items-center rounded-xl border shadow-sm"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <Loader className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    // ERROR
    if (error) {
        return (
            <div className="w-full h-64 flex justify-center items-center rounded-xl border shadow-sm text-red-500"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                {error}
            </div>
        );
    }

    if (!calendarData) return null;

    const { timeSlots, days, weeklyTotals } = calendarData;

    return (
        <div className="w-full rounded-xl border shadow-sm flex flex-col mt-20 max-sm:mt-10"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>

            {/* HEADER */}
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4"
                style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="text-blue-500" size={20} />
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                        Weekly Schedule
                    </h3>
                </div>

                <div className="flex items-center gap-2 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-color)' }}>
                    <button onClick={handlePrevWeek}
                        className="p-1 rounded shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5">
                        <ChevronLeft size={18} style={{ color: 'var(--text-color)' }} />
                    </button>

                    <span className="text-sm font-medium px-2 min-w-[100px] text-center"
                        style={{ color: 'var(--text-color)' }}>
                        {new Date(days[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {" - "}
                        {new Date(days[6].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>

                    <button onClick={handleNextWeek}
                        className="p-1  rounded shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5">
                        <ChevronRight size={18} style={{ color: 'var(--text-color)' }} />
                    </button>
                </div>

                <button onClick={handleToday} className="text-sm text-blue-600 hover:underline">Today</button>
            </div>

            {/* CALENDAR GRID */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px] p-4">
                    {/* HEADER ROW */}
                    <div className="flex">
                        <div className="w-[100px] flex-shrink-0 p-2 font-semibold text-sm border-b border-r"
                            style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                            Day / Time
                        </div>

                        {timeSlots.map((slot, index) => (
                            <div key={index}
                                className="w-[100px] flex-shrink-0 p-2 font-semibold text-[10px] text-center border-b border-r"
                                style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                                {slot}
                            </div>
                        ))}

                        <div className="w-[100px] flex-shrink-0 p-2 font-bold text-sm text-center border-b"
                            style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                            Total
                        </div>
                    </div>

                    {/* DAY ROWS */}
                    {days.map((day) => (
                        <div key={day.date}
                            className="flex border-b transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}>

                            {/* DAY COLUMN */}
                            <div className={`w-[100px] flex-shrink-0 p-3 border-r flex flex-col justify-center 
                                ${day.isToday ? 'bg-blue-50/10' : ''}`}
                                style={{ borderColor: 'var(--border-color)' }}>
                                <span className={`font-semibold text-sm 
                                    ${day.isToday ? 'text-blue-600' : 'text-[var(--text-color)]'}`}>
                                    {day.dayName}
                                </span>
                                <span className="text-xs text-[var(--secondary-color)]">
                                    {new Date(day.date).toLocaleDateString()}
                                </span>
                            </div>

                            {/* CONTENT: CHECK IF LEAVE OR SLOTS */}
                            {day.isLeave ? (
                                <div className="flex-shrink-0 p-2 flex items-center justify-center font-bold text-red-500 bg-red-500/10 tracking-widest uppercase border-r"
                                    style={{ width: `${timeSlots.length * 100}px`, borderColor: 'var(--border-color)' }}>
                                    Leave
                                </div>
                            ) : (
                                <>
                                    {/* TIME SLOTS */}
                                    {timeSlots.map((slot, index) => {
                                        const slotData = day.slots[slot];
                                        const isFull = slotData?.isFull;
                                        const isBreak = slotData?.isBreak;
                                        const count = slotData?.count || 0;

                                        let cellClass = "bg-transparent text-gray-400";
                                        let content = "-";

                                        if (isBreak) {
                                            cellClass = "bg-orange-500/10 text-orange-500";
                                            content = "Break";
                                        } else if (slotData) {
                                            if (isFull) {
                                                cellClass = "bg-red-500/20 text-red-500";
                                                content = "Full";
                                            } else if (count > 0) {
                                                cellClass = "bg-blue-500/20 text-blue-500";
                                                content = `${count} Booked`;
                                            } else {
                                                cellClass = "text-green-600 dark:text-green-400";
                                                content = "Open";
                                            }
                                        } else {
                                            // Ensure empty slots also show "Open" if they exist in the grid structure
                                            // The backend fills missing slots with { count: 0, isFull: false } at the end, 
                                            // so slotData should exist. If not, default to Open.
                                            cellClass = "text-green-600 dark:text-green-400";
                                            content = "Open";
                                        }

                                        return (
                                            <div key={`${day.date}-${index}`}
                                                className={`w-[100px] flex-shrink-0 p-2 border-r flex items-center justify-center text-xs font-medium ${cellClass}`}
                                                style={{ borderColor: 'var(--border-color)' }}>
                                                {content}
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* DAILY TOTAL */}
                            <div className="w-[100px] flex-shrink-0 p-2 flex items-center justify-center font-bold text-sm border-l"
                                style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                                {day.isLeave ? 0 : (day.dailyTotal || 0)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WEEKLY TOTAL */}
            <div className="p-4 border-t rounded-b-xl flex justify-end"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>
                    Weekly Total:
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                        {weeklyTotals?.total || 0}
                    </span> appointments
                </span>
            </div>
        </div>
    );
};

export default DoctorScheduleCalendar;