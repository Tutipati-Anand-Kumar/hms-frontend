import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getProfile, updateProfile } from "../../../api/patients/patientService";
import { Save, ArrowLeft } from "lucide-react";

const UpdatePatientProfile = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    address: "",
    age: "",
    height: "",
    weight: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProfile();
        // Calculate age from DOB if available, otherwise use virtual or empty
        let calculatedAge = "";
        if (res.dob) {
          const birthDate = new Date(res.dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          calculatedAge = age;
        }

        setForm({
          name: res.user?.name || "",
          email: res.user?.email || "",
          mobile: res.user?.mobile || "",
          dob: res.dob ? res.dob.split('T')[0] : "",
          gender: res.gender || "",
          address: res.address || "",
          age: res.age || calculatedAge || "",
          height: res.height || "",
          weight: res.weight || ""
        });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.mobile && form.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    try {
      await updateProfile(form);
      toast.success("Profile updated");
      navigate('/home/patient/profile');
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <button onClick={() => navigate('/home/patient/profile')} className="text-[var(--secondary-color)] hover:text-[var(--text-color)] mb-6 flex items-center gap-2 transition-colors">
        <ArrowLeft size={20} /> Back to Profile
      </button>

      <h1 className="text-2xl font-bold text-[var(--text-color)] mb-6">Update Profile</h1>

      <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] p-8 rounded-xl border border-[var(--border-color)] space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Mobile Number</label>
              <input
                type="tel"
                value={form.mobile}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, mobile: val });
                }}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter 10-digit mobile number"
              />
            </div>

            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => {
                  const dob = e.target.value;
                  let calculatedAge = "";
                  if (dob) {
                    const birthDate = new Date(dob);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    calculatedAge = age;
                  }
                  setForm({ ...form, dob: dob, age: calculatedAge });
                }}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Age</label>
              <input
                type="number"
                value={form.age}
                readOnly
                className="w-full bg-[var(--bg-color)]/50 text-[var(--secondary-color)] p-3 rounded-lg border border-[var(--border-color)] cursor-not-allowed"
                placeholder="Calculated from DOB"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--secondary-color)] mb-2 text-sm">Height (cm)</label>
                <input
                  type="text"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ex: 175"
                />
              </div>
              <div>
                <label className="block text-[var(--secondary-color)] mb-2 text-sm">Weight (kg)</label>
                <input
                  type="text"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ex: 70"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none transition-colors"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--secondary-color)] mb-2 text-sm">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-lg border border-[var(--border-color)] focus:border-blue-500 outline-none resize-none transition-colors h-[132px]"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
        >
          <Save size={18} /> {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default UpdatePatientProfile;
