import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { API } from "../../../api/authservices/authservice";
import toast from "react-hot-toast";
import { X, Activity } from "lucide-react";
import { getPrescriptionTemplate } from "./MedicalRecords";

export default function Prescription() {
    const location = useLocation();
    const navigate = useNavigate();
    const { appointment } = location.state || {};

    const [hospitalDetails, setHospitalDetails] = useState(null);
    const [doctorDetails, setDoctorDetails] = useState(null);

    // Fetch current doctor's profile to parse qualifications and associated hospital
    useEffect(() => {
        const fetchDoctorProfile = async () => {
            try {
                const res = await API.get('/doctors/profile/me');
                if (res.data) {
                    setDoctorDetails(res.data);
                    if (res.data.signature) setSignature(res.data.signature);

                    // If hospital is not in appointment, try to get from doctor's profile
                    if (!appointment?.hospital && res.data.hospitals && res.data.hospitals.length > 0) {
                        // res.data.hospitals is array of {hospital: {...}, ...} - assuming populated? 
                        // Or we might need to fetch it. Let's start with id.
                        const hospInfo = res.data.hospitals[0];
                        if (hospInfo.hospital && typeof hospInfo.hospital === 'object') {
                            setHospitalDetails(hospInfo.hospital);
                        } else if (hospInfo.hospital) {
                            // If it's just ID, fetch it
                            const hRes = await API.get(`/hospitals/${hospInfo.hospital}`);
                            setHospitalDetails(hRes.data);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch doctor profile", e);
            }
        };
        fetchDoctorProfile();
    }, [appointment]);

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(appointment?.patient?._id || "");

    const [patientName, setPatientName] = useState(appointment?.patient?.name || "");
    const [patientDetails, setPatientDetails] = useState(appointment?.patient || null);
    const [loading, setLoading] = useState(false);
    const [uploadingPDF, setUploadingPDF] = useState(false); // Track PDF upload state
    const [signature, setSignature] = useState(null); // URL from profile

    // Mode: 'ai' or 'self'
    const [prescriptionMode, setPrescriptionMode] = useState('ai');

    // Initial Empty State Structure
    const emptyState = {
        symptoms: "",
        reason: "",
        medicines: [],
        diet_advice: [],
        suggested_tests: [],
        follow_up: "",
        avoid: [],
        matchedSymptoms: [],
        weight: "",
        height: "",
        isGenerated: false // Track if generated/editable per mode
    };
    const [showVitals, setShowVitals] = useState(false);

    // --- STATE MANAGEMENT ---

    // 1. AI Data State
    const [aiData, setAiData] = useState(() => {
        const saved = sessionStorage.getItem("hms_ai_prescription");
        if (saved) return JSON.parse(saved);
        return {
            ...emptyState,
            symptoms: appointment?.symptoms ? (Array.isArray(appointment.symptoms) ? appointment.symptoms.join(", ") : appointment.symptoms) : "",
            reason: appointment?.reason || ""
        };
    });

    // 2. Self Data State
    const [selfData, setSelfData] = useState(() => {
        const saved = sessionStorage.getItem("hms_self_prescription");
        if (saved) return JSON.parse(saved);
        return {
            ...emptyState,
            isGenerated: true // Self mode is always "generated" (editable)
        };
    });

    // 3. Current Active Data
    const currentData = prescriptionMode === 'ai' ? aiData : selfData;

    // Store appointments map for quick lookup: patientId -> appointmentDetails
    const [patientAppointments, setPatientAppointments] = useState({});

    // 4. Helper to update current data
    const updateCurrentData = (updates) => {
        if (prescriptionMode === 'ai') {
            setAiData(prev => ({ ...prev, ...updates }));
        } else {
            setSelfData(prev => ({ ...prev, ...updates }));
        }
    };

    const cardRef = useRef(null);

    // AI Verification State
    const [verificationShown, setVerificationShown] = useState(false);
    const [aiVerified, setAiVerified] = useState(false);

    // --- PERSISTENCE ---
    useEffect(() => {
        sessionStorage.setItem("hms_ai_prescription", JSON.stringify(aiData));
    }, [aiData]);

    useEffect(() => {
        sessionStorage.setItem("hms_self_prescription", JSON.stringify(selfData));
    }, [selfData]);


    useEffect(() => {
        fetchPatients();
        if (appointment?.patient) {
            setPatientDetails(prev => ({
                ...prev,
                ...appointment.patient,
                age: appointment.patientDetails?.age || prev?.age,
                gender: appointment.patientDetails?.gender || prev?.gender,
                mrn: appointment.mrn
            }));
            setPatientName(appointment.patient.name);
        }
    }, [appointment]);

    // Sync patient details when patients list loads or selection changes
    useEffect(() => {
        if (selectedPatientId && patients.length > 0) {
            const p = patients.find(x => x._id === selectedPatientId);
            const apptData = patientAppointments[selectedPatientId];

            if (p) {
                setPatientName(p.name);

                // RESET currentData vitals to avoid carrying over previous patient's data
                updateCurrentData({ weight: '', height: '' });

                // Fetch full profile for height/weight
                const fetchDetails = async () => {
                    try {
                        const res = await API.get(`/patients/profile/${selectedPatientId}`);
                        if (res.data) {
                            const profile = res.data;
                            setPatientDetails(prev => ({
                                ...prev,
                                ...p,
                                age: apptData?.patientDetails?.age || apptData?.age || p.age || '',
                                gender: apptData?.patientDetails?.gender || apptData?.gender || p.gender || '',
                                duration: apptData?.patientDetails?.duration || apptData?.duration || '',
                                weight: profile.weight || '',
                                height: profile.height || '',
                                userProfileFetched: true
                            }));
                        }
                    } catch (err) {
                        console.error("Failed to fetch patient profile", err);
                        // Fallback to existing
                        setPatientDetails({
                            ...p,
                            age: apptData?.patientDetails?.age || apptData?.age || p.age || '',
                            gender: apptData?.patientDetails?.gender || apptData?.gender || p.gender || '',
                            duration: apptData?.patientDetails?.duration || apptData?.duration || ''
                        });
                    }
                };
                fetchDetails();
            }
        }

        const fetchHospital = async () => {
            if (appointment?.hospital && !hospitalDetails) {
                if (typeof appointment.hospital === 'string') {
                    try {
                        const res = await API.get(`/hospitals/${appointment.hospital}`);
                        setHospitalDetails(res.data);
                    } catch (e) {
                        console.error("Failed to fetch hospital", e);
                    }
                } else if (typeof appointment.hospital === 'object') {
                    setHospitalDetails(appointment.hospital);
                }
            }
        };
        fetchHospital();

    }, [selectedPatientId, patients, patientAppointments]);

    // Auto-fill reason from symptoms if reason is empty
    useEffect(() => {
        if (currentData.symptoms && !currentData.reason) {
            updateCurrentData({ reason: currentData.symptoms });
        }
    }, [currentData.symptoms]);

    const fetchPatients = async () => {
        try {
            // Fetch appointments to get unique patients
            const res = await API.get("/bookings/my-appointments");
            const apps = res.data;
            const unique = [];
            const seen = new Set();
            const apptMap = {};

            apps.forEach(a => {
                if (a.patient) {
                    // Store the LATEST appointment info for this patient to get age/gender/mrn
                    if (!seen.has(a.patient._id)) {
                        seen.add(a.patient._id);
                        unique.push(a.patient);
                        // Save appointment details for this patient
                        // Check if symptoms string contains duration info or if it's passed differently
                        // For now we just store the appointment object. 
                        // If duration isn't in appointment, it will be blank which is fine.
                        apptMap[a.patient._id] = a;
                    }
                }
            });
            setPatients(unique);
            setPatientAppointments(apptMap);
        } catch (err) {
            console.error("Error fetching patients:", err);
        }
    };

    const handlePatientSelect = (e) => {
        const pid = e.target.value;
        setSelectedPatientId(pid);
        // The useEffect above will handle updating details
    };



    const handleAISearch = async () => {
        if (!currentData.symptoms) {
            toast.error("Please enter symptoms");
            return;
        }
        setLoading(true);
        try {
            const res = await API.post("/ai/prescription", {
                symptoms: currentData.symptoms,
                patientDetails: {
                    age: patientDetails?.age,
                    gender: patientDetails?.gender
                }
            });

            // Ensure arrays
            const data = res.data;

            updateCurrentData({
                medicines: Array.isArray(data.medicines) ? data.medicines : (data.medicines ? [data.medicines] : []),
                diet_advice: Array.isArray(data.diet_advice) ? data.diet_advice : (data.diet_advice ? [data.diet_advice] : []),
                suggested_tests: Array.isArray(data.suggested_tests) ? data.suggested_tests : (data.suggested_tests ? [data.suggested_tests] : []),
                follow_up: data.follow_up || "",
                avoid: Array.isArray(data.avoid) ? data.avoid : (data.avoid ? [data.avoid] : []),
                matchedSymptoms: data.matchedSymptoms || [],

                weight: patientDetails?.weight || "",
                height: patientDetails?.height || "",
                isGenerated: true
            });

            toast.success("Prescription generated! You can now edit the fields.");
            return true;
        } catch (err) {
            console.error("Save Error:", err);
            toast.error("Failed to generate prescription");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPatientId) {
            toast.error("Please select a patient");
            return null;
        }

        try {
            const payload = {
                patient: selectedPatientId,
                symptoms: currentData.symptoms,
                medicines: currentData.medicines,
                diet_advice: currentData.diet_advice,
                suggested_tests: currentData.suggested_tests,
                follow_up: currentData.follow_up,
                avoid: currentData.avoid,
                matchedSymptoms: currentData.matchedSymptoms,
                reason: currentData.reason,
                type: prescriptionMode // Optional: save mode type if backend supports
            };

            const res = await API.post("/prescriptions", payload);
            toast.success("Prescription saved successfully");
            return res.data;
        } catch (err) {
            console.error("Error saving prescription:", err);
            toast.error("Failed to save prescription");
            return null;
        }
    };

    const handleClear = () => {
        const resetData = { ...emptyState, isGenerated: prescriptionMode === 'self' };
        updateCurrentData(resetData);
        setSignature(null);
        setDoctorSignatureText("");
        toast.success("Cleared current form");
    };

    const handleDownload = async () => {
        // Prevent double-click
        if (uploadingPDF) {
            toast.error("Upload already in progress...");
            return;
        }

        const savedData = await handleSave();
        if (!savedData) return;

        setUploadingPDF(true);
        const toastId = toast.loading("Generating and uploading PDF...");

        try {
            const templateData = {
                hospitalName: hospitalDetails?.name || "",
                hospitalAddress: hospitalDetails?.address || "",
                hospitalPhone: hospitalDetails?.phone || "",
                hospitalEmail: hospitalDetails?.email || "",
                patientName: patientName,
                age: patientDetails?.age || "",
                gender: patientDetails?.gender || "",
                // Use currentData for vitals as they might be edited
                weight: currentData.weight || patientDetails?.weight || "",
                height: currentData.height || patientDetails?.height || "",
                date: new Date().toLocaleDateString(),
                mrn: patientDetails?.mrn || appointment?.mrn || "",
                symptoms: currentData.symptoms,
                diagnosis: currentData.reason,
                medicines: currentData.medicines.filter(m => m.trim() !== ""),
                dietAdvice: currentData.diet_advice.filter(d => d.trim() !== ""),
                tests: currentData.suggested_tests.filter(t => t.trim() !== ""),
                followUp: currentData.follow_up,
                avoid: currentData.avoid,

                // Dynamic Doctor Details from Profile
                doctorName: doctorDetails?.user?.name || doctorDetails?.name || appointment?.doctor?.name || "",
                doctorQual: doctorDetails?.qualifications?.join(', ') || "",
                doctorSpecialization: doctorDetails?.specialties?.[0] || doctorDetails?.specialization || "",

                doctorSig: signature,
                doctorSigText: null,
                qrCodeUrl: null,
                showVitals: showVitals
            };

            const cleanHtml = getPrescriptionTemplate(templateData);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cleanHtml;
            tempDiv.style.width = '800px';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

            // FORCE IMAGE LOAD: Wait for all images in the tempDiv to load
            const images = tempDiv.getElementsByTagName('img');
            const imagePromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if error
                });
            });
            await Promise.all(imagePromises);
            // Extra small delay for rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            // COMPRESSION FIX: Reduce scale from 2 to 1 (reduces size by ~75%)
            const canvas = await html2canvas(tempDiv, {
                scale: 1,  // Changed from 2 to 1
                useCORS: true,
                logging: false
            });
            document.body.removeChild(tempDiv);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // COMPRESSION FIX: Use JPEG with 0.8 quality instead of PNG
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, imgWidth, imgHeight);

            // 1. Convert PDF to Base64
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            const pdfBlob = pdf.output('blob');
            const fileName = `${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

            console.log(`📄 PDF Size: ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB`);

            // 2. Upload to Cloudinary via Backend (using buffer method for frontend-generated PDFs)
            const uploadRes = await API.post("/prescriptions/upload-pdf-buffer", {
                pdfBuffer: pdfBase64,
                fileName: fileName,
                patientId: selectedPatientId,
                appointmentId: appointment?._id
            });

            // 3. Save Metadata to Medical Records
            await API.post("/reports/save", {
                patientId: selectedPatientId,
                name: fileName,
                url: uploadRes.data.file.url,
                type: "application/pdf",
                public_id: uploadRes.data.file.public_id,
                date: new Date().toISOString().split('T')[0], // Today's date
                size: uploadRes.data.file.size,
                appointmentId: appointment?._id,
                hospitalId: hospitalDetails?._id || (typeof appointment?.hospital === 'string' ? appointment.hospital : appointment?.hospital?._id)
            });

            // 4. Update Appointment Status to COMPLETED
            if (appointment && appointment._id) {
                await API.put(`/bookings/status/${appointment._id}`, {
                    status: 'completed',
                    reason: 'Prescription generated'
                });
            }

            toast.success("Saved to Patient's Medical Records", { id: toastId });

            pdf.save(fileName);
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

        } catch (error) {
            console.error("PDF/Upload Error:", error);
            toast.error("Failed to generate or upload PDF", { id: toastId });
        } finally {
            setUploadingPDF(false); // Reset loading state
        }
    };

    const handlePrintAndSave = async () => {
        // AI Verification Logic
        if (prescriptionMode === 'ai') {
            if (!verificationShown) {
                setVerificationShown(true);
                // Scroll to bottom to show the message
                setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
                return;
            }
            // No Checkbox verification needed anymore
        }

        // Proceed to generate PDF and Save (Reuse existing logic but modify end step)
        // Prevent double-click
        if (uploadingPDF) {
            toast.error("Process already in progress...");
            return;
        }

        const savedData = await handleSave();
        if (!savedData) return;

        setUploadingPDF(true);
        const toastId = toast.loading("Saving and preparing print...");

        try {
            const templateData = {
                hospitalName: hospitalDetails?.name || "",
                hospitalAddress: hospitalDetails?.address || "",
                hospitalPhone: hospitalDetails?.phone || "",
                hospitalEmail: hospitalDetails?.email || "",
                patientName: patientName,
                age: patientDetails?.age || "",
                gender: patientDetails?.gender || "",
                // Use currentData for vitals as they might be edited
                weight: currentData.weight || patientDetails?.weight || "",
                height: currentData.height || patientDetails?.height || "",
                date: new Date().toLocaleDateString(),
                mrn: patientDetails?.mrn || appointment?.mrn || "",
                symptoms: currentData.symptoms,
                diagnosis: currentData.reason,
                medicines: currentData.medicines.filter(m => m.trim() !== ""),
                dietAdvice: currentData.diet_advice.filter(d => d.trim() !== ""),
                tests: currentData.suggested_tests.filter(t => t.trim() !== ""),
                followUp: currentData.follow_up,
                avoid: currentData.avoid,

                // Dynamic Doctor Details from Profile
                doctorName: doctorDetails?.user?.name || doctorDetails?.name || appointment?.doctor?.name || "",
                doctorQual: doctorDetails?.qualifications?.join(', ') || "",
                doctorSpecialization: doctorDetails?.specialties?.[0] || doctorDetails?.specialization || "",

                doctorSig: signature,
                doctorSigText: null,
                qrCodeUrl: null,
                showVitals: showVitals
            };

            const cleanHtml = getPrescriptionTemplate(templateData);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cleanHtml;
            tempDiv.style.width = '800px';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

            // FORCE IMAGE LOAD
            const images = tempDiv.getElementsByTagName('img');
            const imagePromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if error
                });
            });
            await Promise.all(imagePromises);
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(tempDiv, {
                scale: 1,
                useCORS: true,
                logging: false
            });
            document.body.removeChild(tempDiv);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, imgWidth, imgHeight);

            // 1. Convert PDF to Base64
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            const pdfBlob = pdf.output('blob');
            const fileName = `${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

            // 2. Upload to Cloudinary via Backend
            const uploadRes = await API.post("/prescriptions/upload-pdf-buffer", {
                pdfBuffer: pdfBase64,
                fileName: fileName,
                patientId: selectedPatientId,
                appointmentId: appointment?._id
            });

            // 3. Save Metadata to Medical Records
            await API.post("/reports/save", {
                patientId: selectedPatientId,
                name: fileName,
                url: uploadRes.data.file.url,
                type: "application/pdf",
                public_id: uploadRes.data.file.public_id,
                date: new Date().toISOString().split('T')[0], // Today's date
                size: uploadRes.data.file.size,
                appointmentId: appointment?._id,
                hospitalId: hospitalDetails?._id || (typeof appointment?.hospital === 'string' ? appointment.hospital : appointment?.hospital?._id)
            });

            // 4. Update Appointment Status to COMPLETED
            if (appointment && appointment._id) {
                await API.put(`/bookings/status/${appointment._id}`, {
                    status: 'completed',
                    reason: 'Prescription generated'
                });
            }

            toast.success("Saved to Patient's Medical Records", { id: toastId });

            // PRINT INSTEAD OF DOWNLOAD
            // pdf.save(fileName); // Disabled
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank'); // Opens in new tab, user can print from there

        } catch (error) {
            console.error("PDF/Upload Error:", error);
            toast.error("Failed to generate or upload PDF", { id: toastId });
        } finally {
            setUploadingPDF(false);
        }
    };

    return (
        <div className="h-full md:p-8" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <div className="max-w-7xl mx-auto">
                {/* NEW TOGGLE DESIGN */}
                <div className="flex justify-center mb-8">
                    <div className=" dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 inline-flex shadow-sm w-full max-w-md">
                        <button
                            onClick={() => setPrescriptionMode('ai')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${prescriptionMode === 'ai'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            AI Prescription
                        </button>
                        <button
                            onClick={() => setPrescriptionMode('self')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${prescriptionMode === 'self'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            Self Prescription
                        </button>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center text-blue-500 mb-8">
                    {prescriptionMode === 'ai' ? "AI Prescription Generator" : "Self Prescription"}
                </h1>

                {/* Patient Selection */}
                <div className="p-6 rounded-lg mb-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Select Patient</label>
                            <select
                                className="w-full p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-shadow"
                                style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                value={selectedPatientId}
                                onChange={handlePatientSelect}
                            >
                                <option value="">-- Select Patient --</option>
                                {patients.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} ({p.mobile})</option>
                                ))}
                            </select>

                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Patient Name</label>
                            <input
                                className="w-full p-2.5 rounded-lg text-sm  cursor-not-allowed"
                                style={{ border: '1px solid var(--border-color)', color: 'var(--secondary-color)' }}
                                value={patientName}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Additional Patient Details: Age, Gender, Date, MRN + Vitals Toggle */}
                    <div className="mt-6 relative">
                        {/* GRID LAYOUT: Added cols for vitals to ensure inline flow */}
                        <div className={`grid grid-cols-2 ${showVitals ? 'md:grid-cols-4 lg:grid-cols-8' : 'md:grid-cols-3 lg:grid-cols-6'} gap-3 items-end transition-all duration-300`}>
                            <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Age</label>
                                <input
                                    className="w-full p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                    value={patientDetails?.age || ''}
                                    onChange={(e) => setPatientDetails(prev => ({ ...prev, age: e.target.value }))}
                                    placeholder="Age"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Gender</label>
                                <select
                                    className="w-full p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                    value={patientDetails?.gender || ''}
                                    onChange={(e) => setPatientDetails(prev => ({ ...prev, gender: e.target.value }))}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Duration</label>
                                <input
                                    className="w-full p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                    value={patientDetails?.duration || ''}
                                    onChange={(e) => setPatientDetails(prev => ({ ...prev, duration: e.target.value }))}
                                    placeholder="Amount"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Date</label>
                                <input
                                    className="w-full p-2 rounded-lg text-sm cursor-not-allowed opacity-70"
                                    style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                    value={new Date().toLocaleDateString()}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>MRN</label>
                                <input
                                    className="w-full p-2 rounded-lg text-sm cursor-not-allowed opacity-70"
                                    style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                    value={patientDetails?.mrn || appointment?.mrn || 'N/A'}
                                    readOnly
                                />
                            </div>

                            {/* Toggle Button */}
                            <div className="flex flex-col items-center justify-end pb-1">
                                <span className="text-[10px] text-gray-400 mb-1 font-medium whitespace-nowrap">View Vitals</span>
                                <button
                                    onClick={() => setShowVitals(!showVitals)}
                                    className={`p-2 rounded-full transition-colors ${showVitals ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    title={showVitals ? "Hide Vitals" : "Show Vitals (Height/Weight)"}
                                >
                                    <Activity size={18} />
                                </button>
                            </div>

                            {/* CONDITIONAL INPUTS IN GRID - DIRECTLY HERE */}
                            {showVitals && (
                                <>
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Weight (kg)</label>
                                        <input
                                            className="w-full p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 border border-amber-200"
                                            placeholder="kg"
                                            value={currentData.weight || patientDetails?.weight || ''}
                                            onChange={(e) => updateCurrentData({ weight: e.target.value })}
                                        />
                                    </div>
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Height (cm)</label>
                                        <input
                                            className="w-full p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 border border-amber-200"
                                            placeholder="cm"
                                            value={currentData.height || patientDetails?.height || ''}
                                            onChange={(e) => updateCurrentData({ height: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {/* Symptoms & Diagnosis */}
                <div className="p-6 rounded-lg mb-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Symptoms</label>
                            <input
                                className="w-full p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                placeholder="e.g. fever, cough, headache"
                                value={currentData.symptoms}
                                onChange={(e) => updateCurrentData({ symptoms: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold text-gray-500 mb-1" style={{ color: 'var(--secondary-color)' }}>Diagnosis / Reason</label>
                            <input
                                className="w-full p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                placeholder="e.g. Viral Fever, Migraine"
                                value={currentData.reason}
                                onChange={(e) => updateCurrentData({ reason: e.target.value })}
                            />
                        </div>

                        {/* BUTTON ONLY FOR AI MODE */}
                        {prescriptionMode === 'ai' && (
                            <div className="md:col-span-2 mt-2">
                                <button
                                    onClick={handleAISearch}
                                    disabled={
                                        loading ||
                                        !currentData.symptoms ||
                                        !patientDetails?.age ||
                                        !patientDetails?.gender ||
                                        (!appointment?.mrn && !patientDetails?.mrn && appointment?.mrn !== 'N/A')
                                    }
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                >
                                    {loading ? "Generating Prescription..." : "Generate Prescription with AI"}
                                </button>
                                {(!patientDetails?.age || !patientDetails?.gender || !currentData.symptoms) && (
                                    <p className="text-xs text-red-500 mt-2 text-center animate-pulse">
                                        * Please fill in required fields (Age, Gender, Symptoms) to generate.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Area */}
                {(currentData.isGenerated) && (
                    <div ref={cardRef} className="p-8 rounded-lg shadow-xl mb-6" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
                        <div className="text-center pb-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h2 className="text-2xl font-bold text-blue-500">PRESCRIPTION</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Medicines */}
                            <div>
                                <div className="flex justify-between items-center pb-1 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <h3 className="text-blue-400 font-bold uppercase text-sm">Medicines</h3>
                                    <button
                                        onClick={() => updateCurrentData({ medicines: [...currentData.medicines, ""] })}
                                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-blue-200"
                                    >
                                        + Add Medicine
                                    </button>
                                </div>
                                {currentData.medicines.length > 0 ? (
                                    <div className="space-y-3">
                                        {currentData.medicines.map((m, i) => (
                                            <div key={i} className="flex gap-2 group">
                                                <input
                                                    value={m}
                                                    onChange={(e) => {
                                                        const newMeds = [...currentData.medicines];
                                                        newMeds[i] = e.target.value;
                                                        updateCurrentData({ medicines: newMeds });
                                                    }}
                                                    placeholder="Medicine Name & Dosage"
                                                    className="w-full p-2 rounded-md border-b border-gray-200 focus:border-blue-500 focus:ring-0 text-sm transition-colors"
                                                    style={{
                                                        backgroundColor: 'transparent',
                                                        color: 'var(--text-color)',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newMeds = currentData.medicines.filter((_, idx) => idx !== i);
                                                        updateCurrentData({ medicines: newMeds });
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg opacity-50 hover:opacity-75 transition-opacity" style={{ borderColor: 'var(--border-color)' }}>
                                        <button
                                            onClick={() => updateCurrentData({ medicines: [...currentData.medicines, ""] })}
                                            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                                        >
                                            Click to add medicines
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Diet */}
                                <div>
                                    <div className="flex justify-between items-center pb-1 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <h3 className="text-blue-400 font-bold uppercase text-sm">Diet Advice</h3>
                                        <button
                                            onClick={() => updateCurrentData({ diet_advice: [...currentData.diet_advice, ""] })}
                                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-blue-200"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {currentData.diet_advice.map((d, i) => (
                                            <div key={i} className="flex gap-2 group">
                                                <input
                                                    value={d}
                                                    onChange={(e) => {
                                                        const newDiet = [...currentData.diet_advice];
                                                        newDiet[i] = e.target.value;
                                                        updateCurrentData({ diet_advice: newDiet });
                                                    }}
                                                    className="w-full p-2 text-sm rounded border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    style={{
                                                        backgroundColor: 'var(--bg-color)',
                                                        borderColor: 'var(--border-color)',
                                                        color: 'var(--text-color)',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newDiet = currentData.diet_advice.filter((_, idx) => idx !== i);
                                                        updateCurrentData({ diet_advice: newDiet });
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Tests */}
                                <div>
                                    <div className="flex justify-between items-center pb-1 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <h3 className="text-blue-400 font-bold uppercase text-sm">Suggested Tests</h3>
                                        <button
                                            onClick={() => updateCurrentData({ suggested_tests: [...currentData.suggested_tests, ""] })}
                                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-blue-200"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {currentData.suggested_tests.map((t, i) => (
                                            <div key={i} className="flex gap-2 group">
                                                <input
                                                    value={t}
                                                    onChange={(e) => {
                                                        const newTests = [...currentData.suggested_tests];
                                                        newTests[i] = e.target.value;
                                                        updateCurrentData({ suggested_tests: newTests });
                                                    }}
                                                    className="w-full p-2 text-sm rounded border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    style={{
                                                        backgroundColor: 'var(--bg-color)',
                                                        borderColor: 'var(--border-color)',
                                                        color: 'var(--text-color)',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newTests = currentData.suggested_tests.filter((_, idx) => idx !== i);
                                                        updateCurrentData({ suggested_tests: newTests });
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Follow Up */}
                            <div>
                                <h3 className="text-blue-400 font-bold uppercase text-sm pb-1 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Follow Up</h3>
                                <textarea
                                    value={currentData.follow_up}
                                    onChange={(e) => updateCurrentData({ follow_up: e.target.value })}
                                    rows={2}
                                    className="w-full p-3 rounded-lg border text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: 'var(--bg-color)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-color)',
                                    }}
                                    placeholder="e.g. Visit after 1 week"
                                />
                            </div>

                            {/* Avoid */}
                            <div>
                                <div className="flex justify-between items-center pb-1 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <h3 className="text-blue-400 font-bold uppercase text-sm">Things to Avoid</h3>
                                    <button
                                        onClick={() => updateCurrentData({ avoid: [...currentData.avoid, ""] })}
                                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full transition-colors font-medium border border-blue-200"
                                    >
                                        + Add
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentData.avoid.map((a, i) => (
                                        <div key={i} className="flex gap-2 group">
                                            <input
                                                value={a}
                                                onChange={(e) => {
                                                    const newAvoid = [...currentData.avoid];
                                                    newAvoid[i] = e.target.value;
                                                    updateCurrentData({ avoid: newAvoid });
                                                }}
                                                className="w-full p-2 text-sm rounded border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                style={{
                                                    backgroundColor: 'var(--bg-color)',
                                                    borderColor: 'var(--border-color)',
                                                    color: 'var(--text-color)',
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const newAvoid = currentData.avoid.filter((_, idx) => idx !== i);
                                                    updateCurrentData({ avoid: newAvoid });
                                                }}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Visible Signature Preview + AI Warning */}
                            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                {/* Left Side: AI Warning Message */}
                                <div className="flex-1 pr-8">
                                    {prescriptionMode === 'ai' && verificationShown && (
                                        <p className="text-sm text-red-600 font-medium animate-in fade-in slide-in-from-left duration-500">
                                            The above medicines are AI-generated prescriptions. Please verify the medicines 2–3 times.
                                        </p>
                                    )}
                                </div>

                                {/* Right Side: Signature */}
                                <div className="text-center">
                                    <div className="h-16 flex items-center justify-center mb-2">
                                        {signature ? (
                                            <img src={signature} alt="Sign" className="h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-400 italic text-sm">No signature available</span>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-300 w-48 mx-auto"></div>
                                    <span className="text-xs text-gray-500 font-medium">Doctor's Signature</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-12 px-4">

                    <button
                        onClick={handlePrintAndSave}
                        disabled={uploadingPDF || !currentData.medicines || currentData.medicines.length === 0 || !signature}
                        className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        {uploadingPDF ? 'Processing...' : 'Save & Print'}
                    </button>
                    <button
                        onClick={handleClear}
                        className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                    >
                        Clear All
                    </button>
                </div>
            </div >
        </div >

    );
}
