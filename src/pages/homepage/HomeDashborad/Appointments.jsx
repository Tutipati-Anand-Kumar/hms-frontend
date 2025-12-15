import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { API, getActiveUser } from "../../../api/authservices/authservice";
import BookingSuccessModal from "../../../components/modals/BookingSuccessModal";

export default function Appointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery } = useOutletContext();

  const [view, setView] = useState("history"); // 'new' or 'history'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctor, setDoctor] = useState(null);

  // Patient Details State
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");

  const [reason, setReason] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [previousAppointments, setPreviousAppointments] = useState([]);

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Filter appointments based on search query
  const filteredAppointments = previousAppointments.filter(apt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const doctorName = apt.doctor?.user?.name?.toLowerCase() || "";
    const hospitalName = apt.hospital?.name?.toLowerCase() || "";
    const reasonText = apt.reason?.toLowerCase() || "";

    return doctorName.includes(query) || hospitalName.includes(query) || reasonText.includes(query);
  });

  const [urgency, setUrgency] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isDoctorOnLeave, setIsDoctorOnLeave] = useState(false);

  useEffect(() => {
    fetchAppointments();

    if (location.state?.doctor) {
      setView("new");
      const passedDoc = location.state.doctor;
      const normalizedDoc = {
        _id: passedDoc._id,
        name: passedDoc.name,
        specialties: passedDoc.specialties,
        qualifications: passedDoc.qualifications,
        experience: passedDoc.experience,
        hospitals: passedDoc.hospitals,
        hospital_name: passedDoc.hospitals?.[0]?.name || "Unknown",
        rating: 4.5,
        photo: passedDoc.profilePic || passedDoc.photo, // Use profilePic if available
        availability: passedDoc.availability || ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"],
        consultationFee: passedDoc.hospitals?.[0]?.consultationFee || "N/A"
      };
      setDoctor(normalizedDoc);
      setSelectedDoctorId(normalizedDoc._id);

      console.log("Appointment Doctor Data:", normalizedDoc); // DEBUG LOG

      // Set urgency and symptoms if passed
      if (location.state.urgency) setUrgency(location.state.urgency);
      if (location.state.symptoms) {
        setSymptoms(location.state.symptoms);
        setReason(location.state.symptoms.join(", "));
      }

      // Set Patient Details from Symptom Checker
      if (location.state.age) setAge(location.state.age);
      if (location.state.gender) setGender(location.state.gender);
      if (location.state.duration) setDuration(location.state.duration);
    }
  }, [location.state]);

  // Fetch available hourly blocks when doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctor || !selectedDate) return;

      setLoadingSlots(true);
      setAvailableSlots([]);
      setIsDoctorOnLeave(false); // Reset leave status
      setSelectedTime(""); // Reset selection

      try {
        // Extract hospital ID
        let hospitalId = doctor.hospitals?.[0]?._id || doctor.hospitals?.[0]?.hospital;

        // Handle case where hospital is populated as an object
        if (typeof hospitalId === 'object' && hospitalId !== null) {
          hospitalId = hospitalId._id;
        }

        if (!hospitalId) {
          console.warn("No hospital ID found for doctor");
          setLoadingSlots(false);
          return;
        }

        const res = await API.get("/bookings/availability", {
          params: {
            doctorId: doctor._id,
            hospitalId: hospitalId,
            date: selectedDate
          }
        });

        if (res.data.isLeave) {
          setIsDoctorOnLeave(true);
          setAvailableSlots([]);
          return;
        }

        // Backend returns { slots: [{timeSlot, totalCapacity, bookedCount, isFull, availableCount}, ...] }
        if (res.data.slots && Array.isArray(res.data.slots)) {
          // Filter out full slots and extract timeSlot strings
          // Filter out full slots and extract timeSlot strings
          let availableSlotStrings = res.data.slots
            .filter(slot => !slot.isFull)
            .map(slot => slot.timeSlot);

          // Filter past time slots if date is today
          const todayStr = new Date().toISOString().split('T')[0];
          if (selectedDate === todayStr) {
            const currentHour = new Date().getHours();
            availableSlotStrings = availableSlotStrings.filter(slot => {
              const [time, modifier] = slot.split(' ');
              let [hours] = time.split(':').map(Number);
              if (modifier === 'PM' && hours !== 12) hours += 12;
              if (modifier === 'AM' && hours === 12) hours = 0;
              return hours > currentHour;
            });
          }

          setAvailableSlots(availableSlotStrings);
        } else {
          setAvailableSlots([]);
        }

      } catch (err) {
        console.error("Failed to fetch slots", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [doctor, selectedDate]);

  const fetchAppointments = async () => {
    try {
      const res = await API.get("/bookings/my-appointments");
      setPreviousAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  };

  const handleBookAppointment = async () => {
    if (!doctor) {
      alert("Please select a doctor.");
      return;
    }

    if (!reason || reason.trim() === "") {
      alert("Please enter a reason for the appointment.");
      return;
    }

    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(selectedDate);
    if (selectedDateObj < today) {
      alert("Please select a future date.");
      return;
    }

    if (!selectedTime) {
      alert("Please select a time slot.");
      return;
    }

    // Validate manual inputs
    if (!age || !gender || !duration) {
      alert("Please fill in Age, Gender and Duration.");
      return;
    }

    setLoading(true);
    try {
      await API.post("/bookings/book", {
        doctorId: doctor._id,
        hospitalId: doctor.hospitals?.[0]?._id,
        date: selectedDate,
        timeSlot: selectedTime,
        reason,
        type: "offline",
        urgency, // Send urgency
        symptoms, // Send symptoms
        patientDetails: {
          age,
          gender,
          duration
        }
      });

      // Show Custom Modal instead of alert
      setSuccessMessage("Appointment request sent successfully!");
      setShowSuccessModal(true);

      // Clear symptom checker draft if it exists
      const user = getActiveUser();
      if (user) {
        localStorage.removeItem(`symptomCheckerData_${user.id || user._id}`);
      }

      // NO Navigate here, wait for modal close
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]  lg:p-8 flex flex-col items-center">

      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        message={successMessage}
      />

      <div className="w-full max-w-7xl mx-auto text-center mb-8">
        <h1 className="text-2xl font-bold mb-3  max-sm:text-[18px]  text-[var(--text-color)]">Manage Your Appointments</h1>
        <p className="text-[var(--secondary-color)] leading-relaxed  max-sm:text-[14px]">
          This page helps you easily book a new appointment with your doctor or view your past visit history.
          You can choose your doctor, select a suitable date and time, and share the reason for your visit – all in one place.
        </p>
      </div>
      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-8 bg-[var(--card-bg)] p-1 rounded-lg">
        <button
          onClick={() => setView("new")}
          className={`px-6 py-2 rounded-md transition-colors ${view === "new" ? "bg-blue-600 text-white" : "text-gray-400 "}`}
        >
          New Appointment
        </button>
        <button
          onClick={() => setView("history")}
          className={`px-6 py-2 rounded-md transition-colors ${view === "history" ? "bg-blue-600 text-white" : "text-gray-400 "}`}
        >
          Old Appointments
        </button>
      </div>

      {view === "new" ? (
        <div className="bg-[var(--card-bg)] p-6 rounded-xl max-w-xl w-full border border-[var(--border-color)]">
          <h2 className="text-2xl max-sm:text-[16px] font-bold mb-4 text-blue-400">Book Appointment</h2>

          {doctor ? (
            <>
              <div className="flex gap-4 items-center mb-6">
                <img
                  src={doctor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=1e293b&color=fff&size=60&bold=true`}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full border border-gray-600"
                />
                <div>
                  <p className="font-semibold text-[var(--text-color)]">{doctor.name}</p>
                  <p className="text-[var(--secondary-color)] text-sm">{doctor.specialties?.join(", ")}</p>
                  {doctor.qualifications && (
                    <p className="text-[var(--secondary-color)] text-sm">
                      🎓 {Array.isArray(doctor.qualifications) ? doctor.qualifications.join(", ") : doctor.qualifications}
                    </p>
                  )}
                  {doctor.experience && (
                    <p className="text-[var(--secondary-color)] text-sm">
                      ⭐ {doctor.experience} Years Experience
                    </p>
                  )}
                  <p className="text-[var(--secondary-color)] text-sm">🏥 {doctor.hospital_name}</p>
                  <p className="text-green-600 font-bold text-sm">💰 Consultation Fee: ₹{doctor.consultationFee}</p>
                </div>
              </div>

              {/* Patient Details Inputs */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--secondary-color)]">Age</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g 25 Years"
                    className="w-full p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--secondary-color)]">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--secondary-color)]">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g 2 days"
                    className="w-full p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <textarea
                placeholder="Reason for appointment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full mb-4 p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-600 outline-none"
              />


              <h3 className="mb-2 font-semibold text-[var(--secondary-color)]">Select Date</h3>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                max={new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  const date = e.target.value;
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 14); // 2 weeks from now
                  const maxDateStr = maxDate.toISOString().split('T')[0];

                  if (date > maxDateStr) {
                    alert("You should choose only within two weeks to book doctor appoinment");
                    return;
                  }
                  setSelectedDate(date);
                }}
                className="w-full mb-6 p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] outline-none disabled:opacity-50"
              />

              <h3 className="mb-2 font-semibold text-[var(--secondary-color)]">Select Time Slot</h3>
              <p className="text-xs text-yellow-600 mb-2">You can select only future time slots.</p>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                disabled={loadingSlots || !selectedDate}
                className="w-full mb-6 p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
              >
                <option value="">
                  {loadingSlots ? "Loading slots..." : !selectedDate ? "-- Select Date First --" : isDoctorOnLeave ? "Doctor is on Leave" : "-- Select Time --"}
                </option>
                {availableSlots.length > 0 ? (
                  availableSlots.map((time, index) => (
                    <option key={index} value={time}>
                      {time}
                    </option>
                  ))
                ) : (
                  !loadingSlots && selectedDate && <option disabled>{isDoctorOnLeave ? "Doctor is on Leave" : "No slots available"}</option>
                )}
              </select>

              {isDoctorOnLeave && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
                  ⚠️ This doctor is on leave for the selected date. Please choose another date.
                </div>
              )}

              <button
                onClick={handleBookAppointment}
                disabled={loading}
                className="  px-6 py-2 rounded-lg font-semibold w-full disabled:opacity-50 transition-colors hover:bg-blue-900" style={{ backgroundColor: 'var(--primary-color)' }}
              >
                {loading ? "Booking..." : "Book Appointment"}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Please select a doctor to book an appointment.</p>
              <button
                onClick={() => navigate("/home/aisymptomchecker")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors"
              >
                Go to Symptom Checker
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 max-sm:text-[18px] text-[var(--text-color)]">Appointment History</h2>
          {filteredAppointments.length === 0 ? (
            <div className="bg-[var(--card-bg)] p-8 rounded-lg text-center text-[var(--secondary-color)]">
              {previousAppointments.length === 0 ? "No appointment history found." : "No matching appointments found."}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((apt) => (
                <div key={apt._id} className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--text-color)]">{apt.doctor?.user?.name || "Unknown Doctor"}</h3>
                    <p className="text-[var(--secondary-color)] text-sm">
                      {new Date(apt.date).toLocaleDateString()} at {apt.timeSlot}
                    </p>

                    {/* Hospital Details */}
                    {apt.hospital && (
                      <div className="mt-2 text-sm text-[var(--secondary-color)]">
                        <p className="font-medium text-blue-400">{apt.hospital.name}</p>
                        <p className="text-[var(--secondary-color)] text-xs">{apt.hospital.address}</p>
                      </div>
                    )}

                    {/* Reason */}
                    <div className="mt-3">
                      <h4 className="text-xs font-bold text-[var(--secondary-color)] uppercase tracking-wide">Reason for Visit</h4>
                      <p className="text-[var(--secondary-color)] text-sm mt-1">{apt.reason}</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed' ? 'bg-green-900 text-green-300' :
                    apt.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      apt.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                        'bg-blue-900 text-blue-300'
                    }`}>
                    {apt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
