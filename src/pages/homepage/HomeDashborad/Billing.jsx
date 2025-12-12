import React from 'react';
import { Star } from 'lucide-react';

const Billing = () => {
    const doctors = [
        {
            name: "Dr. Asha Rao",
            specialty: "General Physician",
            experience: "10 yrs",
            rating: 4.6,
            status: "Available",
            fee: 300,
            nextAvailable: "Dec 15, 2025 — 10:30 AM",
            slots: ["10:30 AM", "11:00 AM", "02:00 PM"],
            initials: "AR",
            color: "#00838f"
        },
        {
            name: "Dr. Suresh Patel",
            specialty: "Cardiologist",
            experience: "15 yrs",
            rating: 4.8,
            status: "Available",
            fee: 800,
            nextAvailable: "Dec 16, 2025 — 09:00 AM",
            slots: ["09:00 AM", "01:00 PM", "03:30 PM"],
            initials: "SP",
            color: "#ef5350"
        },
        {
            name: "Dr. Neeta Singh",
            specialty: "Pediatrician",
            experience: "7 yrs",
            rating: 4.5,
            status: "Busy",
            fee: 450,
            nextAvailable: "Dec 15, 2025 — 12:00 PM",
            slots: ["12:00 PM", "04:00 PM"],
            initials: "NS",
            color: "#7e57c2"
        },
        {
            name: "Dr. Ravi Kumar",
            specialty: "Dermatologist",
            experience: "9 yrs",
            rating: 4.4,
            status: "Available",
            fee: 500,
            nextAvailable: "Dec 18, 2025 — 11:00 AM",
            slots: ["11:00 AM", "01:30 PM", "05:00 PM"],
            initials: "RK",
            color: "#00897b"
        }
    ];

    return (
        <div
            className="min-h-screen p-8 transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
        >
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Billing Page</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctors.map((doctor, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl shadow-sm border transition-colors duration-300"
                            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color, #e5e7eb)' }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium"
                                        style={{ backgroundColor: doctor.color }}
                                    >
                                        {doctor.initials}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{doctor.name}</h2>
                                        <p className="text-sm opacity-80 mb-1">{doctor.specialty} • {doctor.experience}</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="flex items-center gap-1 font-medium">
                                                <Star className="w-4 h-4 fill-current text-yellow-400" /> {doctor.rating}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${doctor.status === 'Available'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                            >
                                                {doctor.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs opacity-70">Fee</p>
                                    <p className="text-xl font-bold">₹{doctor.fee}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm opacity-80 mb-2">Next available: <span className="font-medium">{doctor.nextAvailable}</span></p>
                                <p className="text-sm opacity-70 mb-2">Slots:</p>
                                <div className="flex flex-wrap gap-2">
                                    {doctor.slots.map((slot, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 rounded-full border text-xs font-medium opacity-80"
                                            style={{ borderColor: 'var(--border-color, #e5e7eb)' }}
                                        >
                                            {slot}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
                                    Book
                                </button>
                                <button
                                    className="px-6 py-2.5 rounded-lg font-medium border transition-colors hover:bg-opacity-5"
                                    style={{ borderColor: 'var(--border-color, #e5e7eb)' }}
                                >
                                    Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Billing;