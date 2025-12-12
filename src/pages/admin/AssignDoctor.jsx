import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { assignDoctorToHospital, listHospitals, getAllUsers } from "../../api/admin/adminServices";
import { Building2, UserPlus } from "lucide-react";

const AssignDoctor = () => {
    const { setSearchPlaceholder } = useOutletContext();
    const [formData, setFormData] = useState({
        hospitalId: "",
        doctorProfileId: "", // This will be the Doctor ID (e.g., DOC123456)
        specialties: "",
        consultationFee: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSearchPlaceholder("Search...");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await assignDoctorToHospital({
                ...formData,
                specialties: formData.specialties.split(",").map(s => s.trim())
            });
            alert("Doctor assigned successfully!");
            setFormData({ hospitalId: "", doctorProfileId: "", specialties: "", consultationFee: "" });
        } catch (err) {
            alert(err.message || "Assignment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>
                <UserPlus className="text-blue-500" /> Assign Doctor to Hospital
            </h1>

            <form onSubmit={handleSubmit} className="p-8 rounded-xl border space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Hospital ID</label>
                    <input
                        type="text"
                        required
                        placeholder="Enter Hospital ID (e.g., HOSP001)"
                        value={formData.hospitalId}
                        onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Doctor ID</label>
                    <input
                        type="text"
                        required
                        placeholder="Enter Doctor ID (e.g., DOC123456)"
                        value={formData.doctorProfileId}
                        onChange={(e) => setFormData({ ...formData, doctorProfileId: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Specialties (comma separated)</label>
                    <input
                        type="text"
                        placeholder="Cardiology, Neurology"
                        value={formData.specialties}
                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Consultation Fee</label>
                    <input
                        type="number"
                        placeholder="500"
                        value={formData.consultationFee}
                        onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 max-[600px]:text-sm"
                >
                    {loading ? "Assigning..." : "Assign Doctor"}
                </button>
            </form>
        </div>
    );
};

export default AssignDoctor;
