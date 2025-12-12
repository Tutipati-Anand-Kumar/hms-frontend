import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from "../../../api/authservices/authservice";
import {
    FileText, User, Calendar, Activity, Pill, AlertCircle,
    ArrowLeft, CheckCircle, Clock
} from 'lucide-react';

const PrescriptionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/prescriptions/${id}`);
                setPrescription(res.data);
            } catch (err) {
                console.error("Error fetching prescription details:", err);
                setError("Failed to load prescription details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-color)]"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center text-red-400">
            <div className="text-center">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-[var(--primary-color)] hover:underline">Go Back</button>
            </div>
        </div>
    );

    if (!prescription) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]  md:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto">

                {/* Header / Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--secondary-color)] hover:text-[var(--primary-color)] mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Prescriptions</span>
                </button>

                {/* Main Card */}
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">

                    {/* Doctor & Hospital Info Header - Simplified */}
                    <div className="p-4 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-[var(--text-color)] mb-1">
                                    {prescription.doctor?.name || "Unknown Doctor"}
                                </h1>
                                <p className="text-[var(--primary-color)] font-medium text-sm">
                                    {prescription.doctor?.specialization || "General Physician"}
                                </p>
                                <div className="text-[var(--secondary-color)] text-xs mt-1">
                                    <p className="font-semibold text-[var(--text-color)]">{prescription.appointment?.hospital?.name || "Hospital Name Not Available"}</p>
                                    <p>{prescription.appointment?.hospital?.address || "Address Not Available"}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 text-[var(--secondary-color)] bg-[var(--bg-color)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                                    <Calendar size={14} />
                                    <span className="text-sm">{new Date(prescription.date || prescription.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-1 text-xs text-[var(--secondary-color)]">
                                    ID: {prescription._id}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">

                        {/* Diagnosis / Reason */}
                        {prescription.reason && (
                            <div className="bg-[var(--bg-color)] p-5 rounded-xl border border-[var(--border-color)]">
                                <h3 className="text-sm font-bold text-[var(--primary-color)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Activity size={16} /> Diagnosis
                                </h3>
                                <p className="text-lg text-[var(--text-color)] font-medium leading-relaxed">
                                    {prescription.reason}
                                </p>
                            </div>
                        )}

                        {/* Medicines List */}
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                                <Pill className="text-purple-600 dark:text-purple-400" size={20} />
                                Prescribed Medications
                            </h3>
                            <div className="grid gap-3">
                                {prescription.medicines && prescription.medicines.length > 0 ? (
                                    prescription.medicines.map((med, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-4 bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] hover:border-[var(--secondary-color)] transition-colors">
                                            <div className="mt-1 text-purple-600 dark:text-purple-400">
                                                <CheckCircle size={16} />
                                            </div>
                                            <span className="text-[var(--text-color)] font-medium">{med}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[var(--secondary-color)] italic">No medications listed.</p>
                                )}
                            </div>
                        </div>

                        {/* Additional Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">

                            {/* Follow Up */}
                            {prescription.follow_up && (
                                <div className="bg-[var(--bg-color)] p-5 rounded-xl border border-[var(--border-color)]">
                                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Clock size={16} /> Follow Up
                                    </h3>
                                    <p className="text-[var(--text-color)]">
                                        {prescription.follow_up}
                                    </p>
                                </div>
                            )}

                            {/* Notes / Advice */}
                            {(prescription.notes || prescription.diet_advice) && (
                                <div className="bg-[var(--bg-color)] p-5 rounded-xl border border-[var(--border-color)]">
                                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FileText size={16} /> Notes & Advice
                                    </h3>
                                    <div className="space-y-2 text-[var(--text-color)]">
                                        {prescription.diet_advice && (
                                            <p><span className="text-[var(--secondary-color)] text-xs uppercase">Diet:</span> {prescription.diet_advice}</p>
                                        )}
                                        {prescription.notes && (
                                            <p><span className="text-[var(--secondary-color)] text-xs uppercase">Note:</span> {prescription.notes}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionDetails;
