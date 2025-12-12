import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { API } from "../../../api/authservices/authservice";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export default function Prescription() {
    const location = useLocation();
    const navigate = useNavigate();
    const { appointment } = location.state || {};

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(appointment?.patient?._id || "");

    const [patientName, setPatientName] = useState(appointment?.patient?.name || "");
    const [patientDetails, setPatientDetails] = useState(appointment?.patient || null);
    const [loading, setLoading] = useState(false);
    const [uploadingPDF, setUploadingPDF] = useState(false); // Track PDF upload state
    const [signature, setSignature] = useState(null); // Base64 string
    const [doctorSignatureText, setDoctorSignatureText] = useState(""); // Text signature

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
        isGenerated: false // Track if generated/editable per mode
    };

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
                // Merge patient static data with appointment specific data (Age, Gender, MRN, Duration)
                setPatientDetails({
                    ...p,
                    age: apptData?.patientDetails?.age || apptData?.age || p.age || '',
                    gender: apptData?.patientDetails?.gender || apptData?.gender || p.gender || '',
                    duration: apptData?.patientDetails?.duration || apptData?.duration || ''
                });
            }
        }
    }, [selectedPatientId, patients, patientAppointments]);

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

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignature(reader.result);
            };
            reader.readAsDataURL(file);
        }
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
            const cleanHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; color: #333;">
          
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <h2 style="color: #2563eb; font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">PRESCRIPTION</h2>
            <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Generated by MScureChain</p>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px;">
            <div>
              <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
              <p style="margin: 5px 0;"><strong>Age/Gender:</strong> ${patientDetails?.age || 'N/A'} / ${patientDetails?.gender || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${patientDetails?.duration || 'N/A'}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>MRN:</strong> ${appointment?.mrn || patientDetails?.mrn || 'N/A'}</p>
            </div>
          </div>
          
          <div style="margin-bottom:20px;">
            <h3 style="color:#2563eb; border-bottom:1px solid #eee; padding-bottom:5px;">MEDICINES</h3>
            <ul style="list-style:none; padding:0;">
              ${currentData.medicines.map(m => `<li style="padding:5px 0; border-bottom:1px dashed #eee;">${m}</li>`).join('')}
            </ul>
          </div>
          
          <div style="display:flex; gap:20px; margin-bottom:20px;">
            <div style="flex:1;">
              <h3 style="color:#2563eb; border-bottom:1px solid #eee; padding-bottom:5px;">DIET ADVICE</h3>
              <ul style="padding-left:20px;">
                ${currentData.diet_advice.map(d => `<li>${d}</li>`).join('')}
              </ul>
            </div>
            <div style="flex:1;">
              <h3 style="color:#2563eb; border-bottom:1px solid #eee; padding-bottom:5px;">TESTS</h3>
              <ul style="padding-left:20px;">
                ${currentData.suggested_tests.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div style="margin-bottom:20px;">
             <h3 style="color:#2563eb; border-bottom:1px solid #eee; padding-bottom:5px;">FOLLOW UP</h3>
             <p>${currentData.follow_up}</p>
          </div>

          <div style="margin-bottom:30px;">
             <h3 style="color:#2563eb; border-bottom:1px solid #eee; padding-bottom:5px;">AVOID</h3>
             <ul style="padding-left:20px;">
                ${currentData.avoid.map(a => `<li>${a}</li>`).join('')}
             </ul>
          </div>

          <div style="margin-top:60px; display: flex; justify-content: flex-end;">
            <div style="text-align: center; width: 250px;">
                ${signature
                    ? `<img src="${signature}" style="height:60px; margin-bottom:10px; display:block; margin: 0 auto;" />`
                    : (doctorSignatureText
                        ? `<div style="height:60px; margin-bottom:10px; font-family: 'Brush Script MT', cursive; font-size: 24px; color: #000; display:flex; align-items:center; justify-content:center;">${doctorSignatureText}</div>`
                        : '<div style="height:60px;"></div>')
                }
                <p style="border-top:1px solid #ccc; padding-top:5px; margin: 0;">Doctor's Signature</p>
            </div>
          </div>
        </div>
      `;

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cleanHtml;
            tempDiv.style.width = '800px';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

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
                appointmentId: appointment?._id
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

                    {/* Additional Patient Details: Age, Gender, Date, MRN */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
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
                                placeholder="Duration"
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

                            {/* Signatures */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-500">Upload Signature (Image)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-500">or Type Signature</label>
                                    <input
                                        className="w-full p-2 rounded border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.2rem' }}
                                        placeholder="Type name to sign..."
                                        value={doctorSignatureText}
                                        onChange={(e) => setDoctorSignatureText(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-4 pb-12">
                    <button
                        onClick={handleDownload}
                        disabled={uploadingPDF}
                        className={`bg-blue-600 max-sm:text-[12px] max-sm:px-4 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl ${uploadingPDF ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {uploadingPDF ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            'Save & Download PDF'
                        )}
                    </button>

                    <button
                        className="bg-red-500 hover:bg-red-600 text-white  max-sm:text-[12px] max-sm:px-4 px-8 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl"
                        onClick={handleClear}
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
}