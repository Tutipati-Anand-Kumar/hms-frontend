import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../../../api/doctors/doctorService";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Upload, Link as LinkIcon, Plus, X, Clock } from "lucide-react";

const UpdateDoctorProfile = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    specialties: "",
    availability: [],
    consultationFee: "",
    hospitalId: "",
    bio: "",
    quickNotes: []
  });
  const [experienceStart, setExperienceStart] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [imageSource, setImageSource] = useState("url"); // 'url' or 'upload'
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // New Availability State
  const [availDays, setAvailDays] = useState([]);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [is24Hour, setIs24Hour] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyProfile();

        let currentAvailability = [];
        let currentFee = "";
        let currentHospitalId = "";

        if (res.hospitals && res.hospitals.length > 0) {
          // Use the first hospital for now
          const hospitalData = res.hospitals[0];
          currentAvailability = hospitalData.availability || [];
          currentFee = hospitalData.consultationFee || "";
          currentHospitalId = hospitalData.hospital?._id || hospitalData.hospital; // Handle populated or ID
        }

        setForm({
          name: res.user?.name || "",
          email: res.user?.email || "",
          mobile: res.user?.mobile || "",
          specialties: Array.isArray(res.specialties) ? res.specialties.join(", ") : "",
          availability: currentAvailability,
          consultationFee: currentFee,
          hospitalId: currentHospitalId,
          bio: res.bio || "",
          quickNotes: res.quickNotes || []
        });
        setQualifications(Array.isArray(res.qualifications) ? res.qualifications.join(", ") : "");
        setExperienceStart(res.experienceStart ? new Date(res.experienceStart).toISOString().slice(0, 10) : "");
        setProfilePic(res.profilePic || "");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      }
    };
    load();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);
    try {
      const { API } = await import("../../../api/authservices/authservice");
      const res = await API.post("/doctors/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfilePic(res.data.url);
      toast.success("Photo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Generate time slots (30 min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hour = i;
        const minute = j === 0 ? "00" : "30";

        if (is24Hour) {
          slots.push(`${hour.toString().padStart(2, '0')}:${minute}`);
        } else {
          const ampm = hour >= 12 ? "PM" : "AM";
          const hour12 = hour % 12 || 12;
          slots.push(`${hour12}:${minute} ${ampm}`);
        }
      }
    }
    return slots;
  };

  const timeOptions = generateTimeSlots();

  // Helper to convert any format to 12h for saving
  const normalizeTo12Hour = (time) => {
    if (!time) return "";
    // If already 12h format (contains AM/PM), return as is
    if (time.includes("AM") || time.includes("PM")) return time;

    // Convert 24h to 12h
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const handleAddAvailability = () => {
    if (availDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Please select start and end time");
      return;
    }

    const newSlot = {
      days: availDays,
      startTime: normalizeTo12Hour(startTime),
      endTime: normalizeTo12Hour(endTime),
      breakStart: breakStart ? normalizeTo12Hour(breakStart) : "",
      breakEnd: breakEnd ? normalizeTo12Hour(breakEnd) : ""
    };

    setForm(prev => ({
      ...prev,
      availability: [...prev.availability, newSlot]
    }));

    // Reset inputs
    setAvailDays([]);
    setStartTime("09:00 AM");
    setEndTime("05:00 PM");
    setBreakStart("");
    setBreakEnd("");
  };

  const handleRemoveAvailability = (index) => {
    setForm(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.mobile && form.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        specialties: form.specialties.split(",").map(s => s.trim()).filter(s => s),
        qualifications: qualifications.split(",").map(q => q.trim()).filter(Boolean),
        experienceStart: experienceStart ? new Date(experienceStart).toISOString() : null,
        profilePic,
        bio: form.bio,
        // Hospital specific updates
        hospitalId: form.hospitalId,
        availability: form.availability,
        consultationFee: form.consultationFee,
        // Sanitize quickNotes: ensure they have text
        quickNotes: form.quickNotes.filter(n => n.text && n.text.trim() !== "")
      };

      console.log("PAYLOAD DEBUG:", {
        fee: form.consultationFee,
        hospitalId: form.hospitalId,
        fullPayload: payload
      });

      await updateMyProfile(payload);
      toast.success("Profile updated");
      navigate('/doctor/profile');
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setAvailDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Helper to format time for display (e.g., "09:00" -> "9:00 AM")
  const formatTimeDisplay = (time) => {
    if (!time) return "";
    if (time.includes("AM") || time.includes("PM")) return time;
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="h-full md:p-8" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/doctor/profile')} className="mb-6 flex items-center gap-2 transition-colors" style={{ color: 'var(--secondary-color)' }}>
          <ArrowLeft size={20} /> Back to Profile
        </button>

        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>Update Profile</h1>

        <form onSubmit={handleSubmit} className="p-8 rounded-xl shadow-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                <label className="block text-sm mb-3 font-medium" style={{ color: 'var(--secondary-color)' }}>Profile Picture</label>

                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="imageSource"
                      value="url"
                      checked={imageSource === "url"}
                      onChange={() => setImageSource("url")}
                      className="text-blue-600 focus:ring-blue-500"
                      style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                    />
                    <span className="text-sm transition-colors flex items-center gap-1" style={{ color: 'var(--text-color)' }}><LinkIcon size={14} /> Image URL</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="imageSource"
                      value="upload"
                      checked={imageSource === "upload"}
                      onChange={() => setImageSource("upload")}
                      className="text-blue-600 focus:ring-blue-500"
                      style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                    />
                    <span className="text-sm transition-colors flex items-center gap-1" style={{ color: 'var(--text-color)' }}><Upload size={14} /> Upload Photo</span>
                  </label>
                </div>

                {imageSource === "url" ? (
                  <input
                    type="text"
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full p-3 rounded-lg text-sm outline-none transition-colors"
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                  />
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      style={{ color: 'var(--text-color)' }}
                    />
                    {uploading && <p className="text-blue-400 text-xs mt-2 flex items-center gap-1"><Clock size={12} className="animate-spin" /> Uploading...</p>}
                  </div>
                )}

                {/* Image Preview */}
                {profilePic && (
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-xs mb-2" style={{ color: 'var(--secondary-color)' }}>Preview</p>
                    <img src={profilePic} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Full Name</label>
                <input
                  type="text"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 rounded-lg outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-3 rounded-lg outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Mobile Number</label>
                <input
                  type="tel"
                  value={form.mobile || ""}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, mobile: val });
                  }}
                  className="w-full p-3 rounded-lg outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Specialties (comma-separated)</label>
                <textarea
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="e.g., Cardiology, Surgery"
                  className="w-full p-3 rounded-lg h-32 outline-none resize-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={form.consultationFee}
                  onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                  className="w-full p-3 rounded-lg outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm" style={{ color: 'var(--secondary-color)' }}>Availability</label>
                  <button
                    type="button"
                    onClick={() => setIs24Hour(!is24Hour)}
                    className="text-xs px-2 py-1 rounded border transition-colors hover:bg-blue-50"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  >
                    Switch to {is24Hour ? "12h" : "24h"} Format
                  </button>
                </div>

                {/* Add New Slot */}
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  <div className="mb-3">
                    <label className="block text-xs mb-2" style={{ color: 'var(--secondary-color)' }}>Select Days</label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <label key={day} className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:border-blue-500 transition-colors" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                          <input
                            type="checkbox"
                            checked={availDays.includes(day)}
                            onChange={() => toggleDay(day)}
                            className="accent-blue-600"
                          />
                          <span className="text-xs" style={{ color: 'var(--text-color)' }}>{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--secondary-color)' }}>Start Time</label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-2 rounded text-sm outline-none transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                      >
                        <option value="">Select Time</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--secondary-color)' }}>End Time</label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-2 rounded text-sm outline-none transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                      >
                        <option value="">Select Time</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--secondary-color)' }}>Break Start (Optional)</label>
                      <select
                        value={breakStart}
                        onChange={(e) => setBreakStart(e.target.value)}
                        className="w-full p-2 rounded text-sm outline-none transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                      >
                        <option value="">None</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--secondary-color)' }}>Break End (Optional)</label>
                      <select
                        value={breakEnd}
                        onChange={(e) => setBreakEnd(e.target.value)}
                        className="w-full p-2 rounded text-sm outline-none transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                      >
                        <option value="">None</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAvailability}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={16} /> Add Availability
                  </button>
                </div>

                {/* List Existing Slots */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {Array.isArray(form.availability) && form.availability.map((item, idx) => (
                    <div key={idx} className="p-3 rounded flex justify-between items-start" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span className="text-blue-400 font-medium block mb-1 text-sm">
                          {Array.isArray(item.days) ? item.days.join(", ") : item.day}
                        </span>
                        <div className="text-xs" style={{ color: 'var(--text-color)' }}>
                          {item.startTime && item.endTime ? (
                            <div>
                              <p>Working: {formatTimeDisplay(item.startTime)} - {formatTimeDisplay(item.endTime)}</p>
                              {item.breakStart && item.breakEnd && (
                                <p className="text-gray-400">Break: {formatTimeDisplay(item.breakStart)} - {formatTimeDisplay(item.breakEnd)}</p>
                              )}
                            </div>
                          ) : (
                            // Legacy support
                            item.slots && item.slots.map((slot, sIdx) => (
                              <span key={sIdx} className="mr-2">{slot}</span>
                            ))
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAvailability(idx)}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove Entry"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(!form.availability || form.availability.length === 0) && (
                    <p className="text-sm text-center py-2" style={{ color: 'var(--secondary-color)' }}>No availability slots added.</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Qualifications (comma-separated)</label>
                <textarea
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g., MBBS, MD Cardiology"
                  className="w-full p-3 rounded-lg h-32 outline-none resize-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Experience Start Date</label>
                <input
                  type="date"
                  value={experienceStart}
                  onChange={(e) => setExperienceStart(e.target.value)}
                  className="w-full p-3 rounded-lg outline-none transition-colors bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)]"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--secondary-color)' }}>Used to calculate years of experience.</p>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--secondary-color)' }}>Bio</label>
                <textarea
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 rounded-lg h-32 outline-none resize-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-8 shadow-lg shadow-blue-600/20"
          >
            <Save size={18} /> {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateDoctorProfile;