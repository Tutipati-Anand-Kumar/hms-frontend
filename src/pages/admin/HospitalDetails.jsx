import React, { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { getHospitalWithDoctors, removeDoctorFromHospital } from "../../api/admin/adminServices";
import { Building2, MapPin, Phone, Mail, UserMinus } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

const HospitalDetails = () => {
    const { id } = useParams();
    const { setSearchPlaceholder, setFilters } = useOutletContext();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ show: false, doctorId: null });

    useEffect(() => {
        setSearchPlaceholder("Search doctors in this hospital...");
        setFilters([]); // Clear filters for this view
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const data = await getHospitalWithDoctors(id);
            setHospital(data);
        } catch (err) {
            console.error("Failed to fetch hospital details", err);
        } finally {
            setLoading(false);
        }
    };

    const initiateRemove = (doctorProfileId) => {
        setConfirmModal({ show: true, doctorId: doctorProfileId });
    };

    const confirmRemove = async () => {
        if (!confirmModal.doctorId) return;
        try {
            await removeDoctorFromHospital(id, confirmModal.doctorId);
            // Refresh list
            fetchDetails();
        } catch (err) {
            alert("Failed to remove doctor");
        } finally {
            setConfirmModal({ show: false, doctorId: null });
        }
    };

    if (loading) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Loading details...</div>;
    if (!hospital) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Hospital not found</div>;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Card */}
            <div className="rounded-xl border p-8 mb-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-400">
                        <Building2 size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl max-[600px]:text-lg font-bold mb-2" style={{ color: 'var(--text-color)' }}>{hospital.name}</h1>
                        <p className="flex items-center gap-2 mb-4" style={{ color: 'var(--secondary-color)' }}>
                            <MapPin size={18} /> {hospital.address}
                        </p>
                        <div className="flex gap-6 text-sm max-[600px]:text-xs max-[600px]:gap-2" style={{ color: 'var(--secondary-color)' }}>
                            <span className="flex items-center gap-2"><Phone size={16} /> {hospital.phone || "N/A"}</span>
                            <span className="flex items-center gap-2"><Mail size={16} /> {hospital.email || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctors List */}
            <h2 className="text-2xl font-bold mb-6 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>Assigned Doctors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-[600px]:gap-2">
                {hospital.doctors && hospital.doctors.length > 0 ? (
                    hospital.doctors.map((item) => (
                        <div key={item._id} className="p-4 rounded-lg border flex justify-between items-center group hover:border-blue-500 transition-all"
                            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center gap-4 max-[600px]:gap-2">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
                                    {item.doctor?.user?.name?.[0] || "D"}
                                </div>
                                <div>
                                    <h3 className="font-bold max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>{item.doctor?.user?.name || "Unknown Doctor"}</h3>
                                    <p className="text-sm max-[600px]:text-xs" style={{ color: 'var(--secondary-color)' }}>{item.specialties?.join(", ") || "General"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => initiateRemove(item.doctor._id)}
                                className="text-red-400 hover:bg-red-900/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove Doctor"
                            >
                                <UserMinus size={20} />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="col-span-2" style={{ color: 'var(--secondary-color)' }}>No doctors assigned to this hospital yet.</p>
                )}
            </div>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.show}
                onClose={() => setConfirmModal({ show: false, doctorId: null })}
                onConfirm={confirmRemove}
                title="Remove Doctor"
                message="Are you sure you want to remove this doctor from the hospital?"
                type="danger"
                confirmText="Remove"
            />
        </div>
    );
};

export default HospitalDetails;
