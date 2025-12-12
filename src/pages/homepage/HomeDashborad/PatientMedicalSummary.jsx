// PatientMedicalSummary.jsx
import React, { useEffect, useState } from "react";
import { API } from "../../../api/authservices/authservice";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


const splitAndTrim = (str) =>
  String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const joinForInput = (arr) => (Array.isArray(arr) ? arr.join(", ") : String(arr || ""));

const PatientMedicalSummary = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // display state (what user sees)
  const [allergies, setAllergies] = useState([]); // array of strings
  const [medicalHistory, setMedicalHistory] = useState(""); // string
  const [medications, setMedications] = useState([]); // array of strings

  // edit form state (string inputs)
  const [editMode, setEditMode] = useState(false);
  const [formAllergies, setFormAllergies] = useState(""); // comma separated
  const [formMedicalHistory, setFormMedicalHistory] = useState("");
  const [formMedicines, setFormMedicines] = useState("");

  // inside PatientMedicalSummary component (replace existing fetchProfile and handleSave)

const [profileExists, setProfileExists] = useState(true); // assume true until proven otherwise

const fetchProfile = async () => {
  setLoading(true);
  try {
    const res = await API.get("/patients/profile");
    const data = res?.data || {};

    const af = Array.isArray(data.allergies) ? data.allergies : splitAndTrim(data.allergies);
    const mh = data.medicalHistory ?? data.medicalHistoryNotes ?? "";
    const meds = Array.isArray(data.medications) ? data.medications : splitAndTrim(data.medications);

    setAllergies(af);
    setMedicalHistory(mh || "");
    setMedications(meds);

    setFormAllergies(joinForInput(af));
    setFormMedicalHistory(mh || "");
    setFormMedicines(joinForInput(meds));

    setProfileExists(true);
  } catch (err) {
    // If API returns 404, profile not found -> do not attempt PATCH to create
    if (err?.response && err.response.status === 404) {
      setProfileExists(false);
      // initialize defaults so UI still works
      setAllergies([]);
      setMedicalHistory("");
      setMedications([]);
      setFormAllergies("");
      setFormMedicalHistory("");
      setFormMedicines("");
    } else {
      console.error("Failed to load profile medical info", err);
      
    }
  } finally {
    setLoading(false);
  }
};

const handleSave = async () => {
  // validation
  if ((formMedicalHistory || "").length > 1000) {
    toast.error("Medical history too long (max 1000 chars)");
    return;
  }

  // prepare arrays
  const newAllergiesArr = splitAndTrim(formAllergies).map((a) => a.slice(0, 60));
  const newMedicationsArr = splitAndTrim(formMedicines).map((m) => m.slice(0, 60));
  const newMedicalHistory = String(formMedicalHistory || "").slice(0, 1000);

  // convert to strings because your backend schema stores them as String
  const allergiesString = newAllergiesArr.length ? newAllergiesArr.join(", ") : "None";
  const medicationsString = newMedicationsArr.length ? newMedicationsArr.join(", ") : "None";

  // optimistic UI update
  const prev = { allergies, medicalHistory, medications };
  setAllergies(newAllergiesArr);
  setMedications(newMedicationsArr);
  setMedicalHistory(newMedicalHistory);
  setEditMode(false);
  setSaving(true);

  const payload = {
    // send strings to match backend schema
    allergies: allergiesString,
    medicalHistory: newMedicalHistory,
    medications: medicationsString
  };

  // If profile does not exist, do NOT call PATCH — navigate user to edit full profile page to create it
  if (!profileExists) {
    toast.dismiss();
    toast.success("Please complete full profile to save medical info");
    // pass current form values to the edit page so it can prefill fields there
    navigate("/patient/profile/edit", {
      state: {
        fromSummary: true,
        prefill: {
          allergies: allergiesString,
          medicalHistory: newMedicalHistory,
          medications: medicationsString
        }
      }
    });
    setSaving(false);
    return;
  }

  try {
    // use the backend route that exists: /patients/profile
    await API.patch("/patients/profile", payload);

    // re-fetch to load canonical server values
    await fetchProfile();
    toast.success("Medical summary saved");
  } catch (err) {
    console.error("Save failed", err?.response || err);
    // revert optimistic update
    setAllergies(prev.allergies);
    setMedications(prev.medications);
    setMedicalHistory(prev.medicalHistory);

    // show helpful message and suggest full-profile edit if relevant
    if (err?.response) {
      const status = err.response.status;
      if (status === 404) {
        toast.error("Profile not found on server. Open full profile editor.");
        navigate("/patient/profile/edit", {
          state: {
            prefill: {
              allergies: allergiesString,
              medicalHistory: newMedicalHistory,
              medications: medicationsString
            }
          }
        });
      } else if (status >= 500) {
        toast.error("Server error while saving. Please try again later.");
      } else if (status === 401) {
        toast.error("Unauthorized. Please login again.");
      } else {
        toast.error(`Save failed (${status}).`);
      }
    } else {
      // network or CORS issue
      toast.error("Network error. Check console and server.");
    }
  } finally {
    setSaving(false);
  }
};


  // backup to revert on cancel/error
  const [backup, setBackup] = useState(null);

  // fetch profile and map fields
//   const fetchProfile = async () => {
//     setLoading(true);
//     try {
//       const res = await API.get("/patients/profile");
//       const data = res?.data || {};

//       // API shape in your screenshot: allergies, medicalHistory, medications
//       const af = Array.isArray(data.allergies) ? data.allergies : splitAndTrim(data.allergies);
//       const mh = data.medicalHistory ?? data.medicalHistoryNotes ?? "";
//       const meds = Array.isArray(data.medications) ? data.medications : splitAndTrim(data.medications);

//       setAllergies(af);
//       setMedicalHistory(mh || "");
//       setMedications(meds);

//       // initialize form inputs
//       setFormAllergies(joinForInput(af));
//       setFormMedicalHistory(mh || "");
//       setFormMedicines(joinForInput(meds));
//     } catch (err) {
//       console.error("Failed to load profile medical info", err);
//       toast.error("Unable to load medical info");
//     } finally {
//       setLoading(false);
//     }
//   };

  useEffect(() => {
    fetchProfile();
  }, []);

  const startEditing = () => {
    setBackup({ allergies, medicalHistory, medications });
    setFormAllergies(joinForInput(allergies));
    setFormMedicalHistory(medicalHistory);
    setFormMedicines(joinForInput(medications));
    setEditMode(true);
  };

  const cancelEditing = () => {
    // revert form values from backup
    setFormAllergies(joinForInput(backup?.allergies || []));
    setFormMedicalHistory(backup?.medicalHistory || "");
    setFormMedicines(joinForInput(backup?.medications || []));
    setEditMode(false);
  };
//   const handleSave = async () => {
//   // validate
//   if ((formMedicalHistory || "").length > 1000) {
//     toast.error("Medical history too long (max 1000 chars)");
//     return;
//   }

//   const newAllergies = splitAndTrim(formAllergies).map((a) => a.slice(0, 60));
//   const newMedications = splitAndTrim(formMedicines).map((m) => m.slice(0, 60));
//   const newMedicalHistory = String(formMedicalHistory || "").slice(0, 1000);

//   const prev = { allergies, medicalHistory, medications };
//   setAllergies(newAllergies);
//   setMedications(newMedications);
//   setMedicalHistory(newMedicalHistory);
//   setEditMode(false);
//   setSaving(true);

//   const payload = {
//     allergies: newAllergies,
//     medicalHistory: newMedicalHistory,
//     medications: newMedications,
//   };

//   // endpoints to try (most likely first)
//   const endpoints = [
//     "/patients/profile",       // preferred
//     "/patient/profile/edit",   // fallback you tried
//     "/patients/profile/edit"   // another common variant
//   ];

//   let saved = false;
//   for (const ep of endpoints) {
//     try {
//       const res = await API.patch(ep, payload);
//       // success
//       saved = true;
//       // re-fetch to ensure server returned canonical data
//       await fetchProfile();
//       toast.success("Medical summary saved");
//       break;
//     } catch (err) {
//       // Axios error; log details to console for debugging
//       console.error(`PATCH ${ep} failed`, err?.response || err);
//       // If server responded with 404, move to next endpoint. For CORS or network error, break so you can inspect.
//       if (err?.response) {
//         const status = err.response.status;
//         if (status === 404) {
//           // try next endpoint
//           continue;
//         } else if (status === 401) {
//           toast.error("Unauthorized. Please login.");
//           break;
//         } else {
//           // other server error
//           toast.error(`Save failed (${status})`);
//           break;
//         }
//       } else {
//         // no response (network / CORS)
//         toast.error("Network or CORS error. Check backend or console.");
//         break;
//       }
//     }
//   }

//   if (!saved) {
//     // revert optimistic update
//     setAllergies(prev.allergies);
//     setMedications(prev.medications);
//     setMedicalHistory(prev.medicalHistory);
//   }

//   setSaving(false);
// };


//   const handleSave = async () => {
//     // simple validation
//     if ((formMedicalHistory || "").length > 1000) {
//       toast.error("Medical history too long (max 1000 chars)");
//       return;
//     }

//     // prepare arrays
//     const newAllergies = splitAndTrim(formAllergies).map((a) => a.slice(0, 60));
//     const newMedications = splitAndTrim(formMedicines).map((m) => m.slice(0, 60));
//     const newMedicalHistory = String(formMedicalHistory || "").slice(0, 1000);

//     // optimistic UI
//     const prev = { allergies, medicalHistory, medications };
//     setAllergies(newAllergies);
//     setMedications(newMedications);
//     setMedicalHistory(newMedicalHistory);
//     setEditMode(false);
//     setSaving(true);

//     // prepare payload: adjust keys to match your backend
//     const payload = {
//       // use top-level fields used in your DB: allergies, medicalHistory, medications
//       allergies: newAllergies,
//       medicalHistory: newMedicalHistory,
//       medications: newMedications
//     };

//     try {
//       // If your backend supports PATCH /patients/profile (as used elsewhere), this will work.
//       await API.patch("/patient/profile", payload);

//       // re-fetch to ensure saved state (and any server-side shaping)
//       await fetchProfile();

//       toast.success("Medical summary saved");
//     } catch (err) {
//       console.error("Save failed", err);
//       // revert optimistic
//       setAllergies(prev.allergies);
//       setMedications(prev.medications);
//       setMedicalHistory(prev.medicalHistory);
//       toast.error("Failed to save. Please try again.");
//       // leave editMode off (UX choice)
//     } finally {
//       setSaving(false);
//     }
//   };

  // Small helper to render tag lists
  const renderTagList = (list, emptyText, bgClass = "bg-red-100 text-red-600", itemClass = "text-xs") => {
    if (!list || list.length === 0) {
      return <div className="text-sm text-[var(--secondary-color)] italic">{emptyText}</div>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {list.map((item, i) => (
          <span key={i} className={`px-2 py-1 ${bgClass} rounded ${itemClass}`}>{item}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow border border-[var(--border-color)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold mb-2 text-[var(--text-color)]">Patient Medical Summary</h3>
          
        </div>

        <div className="ml-4">
          {!editMode ? (
            <div className="flex gap-2">
              <button
                onClick={startEditing}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>

               </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`text-sm px-3 py-1 rounded-md ${saving ? "bg-blue-600/60 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="text-sm px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Allergies */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[var(--text-color)]">Allergies</h4>
            <span className="text-xs text-[var(--secondary-color)]">comma separated</span>
          </div>

          {!editMode ? (
            <div className="mt-2">
              {renderTagList(allergies, "No allergies listed", "bg-red-100 text-red-600")}
            </div>
          ) : (
            <input
              type="text"
              value={formAllergies}
              onChange={(e) => setFormAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Pollen"
              className="mt-2 w-full p-2 border rounded-md bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
              maxLength={500}
            />
          )}
        </div>

        {/* Medical History */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[var(--text-color)]">Medical History</h4>
            <span className="text-xs text-[var(--secondary-color)]">notes</span>
          </div>

          {!editMode ? (
            <div className="mt-2 text-sm text-[var(--secondary-color)]">
              {medicalHistory ? medicalHistory : <span className="italic">No medical history reported</span>}
            </div>
          ) : (
            <textarea
              value={formMedicalHistory}
              onChange={(e) => setFormMedicalHistory(e.target.value)}
              placeholder="Enter medical history..."
              className="mt-2 w-full p-2 border rounded-md bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
              rows={4}
              maxLength={1000}
            />
          )}
        </div>

        {/* Medications */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[var(--text-color)]">Medications</h4>
            <span className="text-xs text-[var(--secondary-color)]">comma separated</span>
          </div>

          {!editMode ? (
            <div className="mt-2">
              {renderTagList(medications, "No medications listed", "bg-green-100 text-green-700")}
            </div>
          ) : (
            <input
              type="text"
              value={formMedicines}
              onChange={(e) => setFormMedicines(e.target.value)}
              placeholder="e.g. Paracetamol 500mg, Metformin"
              className="mt-2 w-full p-2 border rounded-md bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
              maxLength={500}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalSummary;
