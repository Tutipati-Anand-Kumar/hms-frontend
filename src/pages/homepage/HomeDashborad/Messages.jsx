import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API, getActiveUser } from "../../../api/authservices/authservice";
import { FaMapMarkerAlt, FaExclamationTriangle, FaTrash } from "react-icons/fa";

const STORAGE_KEY_PREFIX = "symptomCheckerData_";

export default function Messages() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [urgency, setUrgency] = useState(null);
  const [duration, setDuration] = useState("1–3 days");
  // const [age, setAge] = useState(""); // Replaced by years/months
  const [patientName, setPatientName] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("0");
  const [gender, setGender] = useState("");

  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const navigate = useNavigate();
  const user = getActiveUser();
  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id || user._id}` : null;

  const symptomsList = [
    "fever",
    "cough",
    "headache",
    "fatigue",
    "weakness",
    "dizziness",
    "chest pain",
    "abdominal pain",
    "back pain",
    "joint pain",
    "muscle pain",
    "neck pain",
    "vision problems",
    "eye redness",
    "ear pain",
    "ear discharge",
    "throat pain",
    "sore throat",
    "nasal congestion",
    "runny nose",
    "vomiting",
    "nausea",
    "diarrhea",
    "constipation",
    "acidity",
    "heartburn",
    "bloating",
    "skin rash",
    "itching",
    "acne",
    "hair loss",
    "urinary issues",
    "burning urination",
    "frequent urination",
    "anxiety",
    "depression",
    "insomnia",
    "seizures",
    "numbness",
    "pregnancy",
    "menstrual cramps",
    "irregular periods",
    "palpitations",
    "shortness of breath",
    "wheezing",
    "tooth pain",
    "bleeding gums"
  ];

  const durationOptions = [
    "Less than 24 hours",
    "1–3 days",
    "4–7 days",
    "More than a week",
  ];


  // Gender-specific limitations
  const femaleSymptoms = ["pregnancy", "menstrual cramps", "irregular periods"];
  const maleSymptoms = []; // Add if any (e.g., "prostate issues")

  // Load data from localStorage on mount
  useEffect(() => {
    if (!storageKey) {
      setIsInitialLoad(false);
      return;
    }

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // ... (existing parsing logic) ...
        setSelectedSymptoms(parsed.selectedSymptoms || []); // We will filter this in the gender effect if needed, but safe to load first
        setPatientName(parsed.patientName || "");

        const savedAge = parsed.age || "";
        if (savedAge.includes("Years")) {
          const parts = savedAge.match(/(\d+)\s*Years\s*(\d+)\s*Months/);
          if (parts) {
            setAgeYears(parts[1]);
            setAgeMonths(parts[2]);
          } else {
            setAgeYears(savedAge.replace(/\D/g, ""));
          }
        } else {
          setAgeYears(savedAge.replace(/\D/g, ""));
          setAgeMonths("0");
        }

        setGender(parsed.gender || "");
        setDuration(parsed.duration || "1–3 days");
        setFilteredDoctors(parsed.filteredDoctors || []);
        setUrgency(parsed.urgency || null);
      } catch (err) {
        console.error("Failed to parse saved data:", err);
      }
    }
    setIsInitialLoad(false);
  }, [storageKey]);

  // Handle Gender Change & Clear Incompatible Symptoms
  useEffect(() => {
    if (gender === "Male") {
      setSelectedSymptoms(prev => prev.filter(s => !femaleSymptoms.includes(s)));
    }
    // Reserved for future male-specific logic
    // if (gender === "Female") {
    //   setSelectedSymptoms(prev => prev.filter(s => !maleSymptoms.includes(s)));
    // }
  }, [gender]);

  // Save data to localStorage
  useEffect(() => {
    if (isInitialLoad || !storageKey) return;

    const dataToSave = {
      selectedSymptoms,
      patientName,
      age: `${ageYears} Years ${ageMonths} Months`,
      gender,
      duration,
      filteredDoctors,
      urgency
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [selectedSymptoms, patientName, ageYears, ageMonths, gender, duration, filteredDoctors, urgency, isInitialLoad, storageKey]);

  const toggleSymptom = (symptom) => {
    // Prevent selecting incompatible symptoms manually
    if (gender === "Male" && femaleSymptoms.includes(symptom)) return;

    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Validate age input - only integers
  const handleYearChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setAgeYears(value);
    }
  };

  // Validate form before running check
  const validateForm = () => {
    const y = parseInt(ageYears) || 0;
    const m = parseInt(ageMonths) || 0;

    if (y === 0 && m === 0) {
      setError("Please enter a valid age.");
      return false;
    }

    if (y > 120) {
      setError("Please enter a valid age (Years <= 120).");
      return false;
    }

    if (!gender) {
      setError("Please select your gender.");
      return false;
    }

    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom.");
      return false;
    }



    return true;
  };

  const handleSuggest = async () => {
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setFilteredDoctors([]);
    setUrgency(null);

    try {
      const res = await API.post("/ai/check-symptoms", {
        symptoms: selectedSymptoms,
        duration,
        // Send composite string so backend logic (parseInt) sees "5 Years..." -> 5
        // or human reader sees "0 Years 6 Months"
        age: `${ageYears} Years ${ageMonths} Months`,
        gender,

        isEmergency
      });

      setUrgency(res.data.urgency);
      setFilteredDoctors(res.data.doctors);
    } catch (err) {
      console.error(err);
      setError("Failed to check symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedSymptoms([]);
    setFilteredDoctors([]);
    setUrgency(null);
    setDuration("1–3 days");
    setPatientName("");
    setAgeYears("");
    setAgeMonths("0");
    setGender("");

    setIsEmergency(false);
    setError(null);
    setUserLocation(null);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  const handleBook = (doctor) => {
    // Navigate to /home/appointments with doctor info, urgency, and symptoms
    navigate("/home/appointments", {
      state: {
        doctor,
        urgency,
        symptoms: selectedSymptoms,
        patientName, // Pass Name
        age: `${ageYears} Years ${ageMonths} Months`, // Pass Age
        gender, // Pass Gender
        duration // Pass Duration
      }
    });
  };

  // Location Logic
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleNearbySearch = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Sort doctors by distance of their first hospital
        const sorted = [...filteredDoctors].map(doc => {
          if (doc.hospitals && doc.hospitals.length > 0) {
            let minDist = Infinity;

            doc.hospitals.forEach(h => {
              if (h.location && h.location.lat && h.location.lng) {
                const dist = getDistanceFromLatLonInKm(
                  latitude,
                  longitude,
                  h.location.lat,
                  h.location.lng
                );
                if (dist < minDist) minDist = dist;
              }
            });

            return { ...doc, distance: minDist };
          }
          return { ...doc, distance: Infinity };
        }).sort((a, b) => a.distance - b.distance);

        setFilteredDoctors(sorted);
      },
      (err) => {
        console.error(err);
        alert("Unable to retrieve your location");
      }
    );
  };

  return (
    <div className="min-h-screen  bg-[var(--bg-color)] text-[var(--text-color)] max-sm:w-full sm:p-6 lg:p-8  ">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text- max-sm:text-[18px] font-bold mb-2 text-blue-400">
          AI Symptom Checker
        </h1>
        <p className="text-[var(--secondary-color)] mb-6 sm:mb-8 text-sm sm:text-base">
          Select symptoms and get recommendations. This is a rule-based helper — not a diagnosis.
        </p>

        {/* Patient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[var(--secondary-color)] mb-2 text-sm font-medium">
                  Age (Years) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ageYears}
                  onChange={handleYearChange}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-lg text-[var(--text-color)] focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 25"
                />
              </div>
              <div className="w-3/7">
                <label className="block text-[var(--secondary-color)] mb-2 text-sm font-medium">
                  Months <span className="text-red-400">*</span>
                </label>
                <select
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(e.target.value)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-lg text-[var(--text-color)] focus:border-blue-500 focus:outline-none text-sm"
                >
                  {[...Array(12).keys()].map(m => (
                    <option key={m} value={m}>{m} Months</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[var(--secondary-color)] mb-2 text-sm font-medium">
              Gender <span className="text-red-400">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-lg text-[var(--text-color)] focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>




            {/* Emergency Checkbox */}
            <div className=" ">
              <label className="flex items-center gap-2 cursor-pointer  mb-2 ">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 cursor-pointer "
                />
                <span className="text-sm text-[var(--text-color)   ]">Emergency</span>
              </label>

              {/* Emergency Urgency Display */}
              {isEmergency && (
                <div className=" p-2 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500" size={16} />
                  <span className="text-red-400 text-sm font-semibold">
                    Urgency Level: Emergency
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[var(--secondary-color)] mb-2 text-sm font-medium">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-lg text-[var(--text-color)] focus:border-blue-500 focus:outline-none"
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Symptoms */}
        <h2 className="text-base sm:text-lg text-[var(--secondary-color)] mb-3 font-medium">
          Tell us your main symptoms <span className="text-red-400">*</span>
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {symptomsList.map((symptom) => {
            const isFemaleOnly = femaleSymptoms.includes(symptom);
            const isDisabled = (gender === "Male" && isFemaleOnly);

            return (
              <label
                key={symptom}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors text-xs font-medium cursor-pointer select-none ${isDisabled
                  ? "bg-gray-700/50 border-gray-700 opacity-50 cursor-not-allowed"
                  : selectedSymptoms.includes(symptom)
                    ? "bg-blue-500/20 border-blue-500 text-blue-300"
                    : "bg-[var(--card-bg)] hover:bg-[var(--border-color)] border-[var(--border-color)] text-[var(--secondary-color)]"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(symptom)}
                  onChange={() => toggleSymptom(symptom)}
                  className="w-3 h-3 rounded-sm accent-blue-500"
                  disabled={isDisabled}
                />
                <span className="capitalize">{symptom}</span>
              </label>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 flex items-center gap-2">
            <FaExclamationTriangle />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handleSuggest}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white text-sm sm:text-base"
          >
            {loading ? "Checking..." : "Run Check"}
          </button>

          <button
            onClick={handleClear}
            className="bg-red-400 hover:bg-red-700 px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm sm:text-base text-white"
          >

            Clear
          </button>
        </div>

        {/* Result Card */}
        {urgency && (
          <div className="bg-[var(--card-bg)]   border border-[var(--border-color)] p-2 rounded-xl mb-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-4">Urgency Result</h3>

            <p className="text-[var(--secondary-color)] mb-3 text-sm sm:text-base">
              <strong className="text-[var(--text-color)]">Urgency Level:</strong>{" "}
              <span className={`${urgency.includes("Emergency") ? "text-red-500 font-bold animate-pulse" : "text-blue-300"}`}>
                {urgency}
              </span>
            </p>

            <div className="text-[var(--secondary-color)] mb-6 text-sm sm:text-base space-y-1">
              <p><strong className="text-[var(--text-color)]">Symptoms:</strong> {selectedSymptoms.join(", ")}</p>
              <p><strong className="text-[var(--text-color)]">Duration:</strong> {duration}</p>

              <p><strong className="text-[var(--text-color)]">Age:</strong> {ageYears} Years {ageMonths} Months</p>
              <p><strong className="text-[var(--text-color)]">Gender:</strong> {gender}</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-blue-300">
                Recommended Doctors ({filteredDoctors.length})
              </h3>
              <button
                onClick={handleNearbySearch}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
              >
                <FaMapMarkerAlt /> Find Nearby
              </button>
            </div>

            {filteredDoctors.length === 0 ? (
              <p className="text-[var(--secondary-color)] text-center py-8">No matching doctors found.</p>
            ) : (
              <div className="space-y-4">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc._id}
                    className="bg-[var(--bg-color)] p-4 rounded-xl border border-[var(--border-color)] hover:border-blue-500 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Doctor Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={doc.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=1e293b&color=fff&size=80&bold=true`}
                          alt={doc.name}
                          className="w-16 h-16  sm:w-20 sm:h-20 rounded-full border-2 border-gray-600 object-cover flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[var(--text-color)] text-lg max-sm:text-[16px] mb-1">{doc.name}</h4>

                          <div className="space-y-1 text-sm">
                            <p className="text-blue-400 font-medium max-sm:hidden">
                              {doc.specialties?.join(", ") || "General Physician"}
                            </p>

                            {doc.qualifications && doc.qualifications.length > 0 && (
                              <p className="text-[var(--secondary-color)] max-sm:hidden">
                                <span className="font-semibold  max-sm:hidden text-[var(--text-color)]">Qualification:</span> {doc.qualifications.join(", ")}
                              </p>
                            )}

                            {doc.experience && (
                              <p className="text-[var(--secondary-color)]">
                                <span className="font-semibold max-sm:hidden text-[var(--text-color)]">Experience:</span> {doc.experience}
                              </p>
                            )}

                            {doc.hospitals && doc.hospitals.length > 0 && (
                              <div className="text-[var(--secondary-color)]">
                                <p className="flex items-center gap-1">
                                  🏥 <span className="font-semibold text-[var(--text-color)]">{doc.hospitals[0].name}</span>
                                </p>
                                {doc.distance !== undefined && doc.distance !== Infinity && (
                                  <p className="text-green-400 text-xs flex items-center gap-1 mt-1">
                                    <FaMapMarkerAlt size={10} /> {doc.distance.toFixed(1)} km away
                                  </p>
                                )}
                              </div>
                            )}

                            <p className="text-yellow-400 flex items-center gap-1   max-sm:hidden">
                              ⭐ {doc.rating || "4.5"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Book Button */}
                      <div className="flex items-center lg:items-start">
                        <button
                          onClick={() => handleBook(doc)}
                          className="bg-[var(--primary-color)] hover:bg-blue-800 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors w-full lg:w-auto"
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
