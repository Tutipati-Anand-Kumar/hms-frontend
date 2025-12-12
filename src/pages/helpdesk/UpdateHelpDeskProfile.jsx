import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import helpdeskService from "../../api/helpdesk/helpdeskService";
import toast from "react-hot-toast";
import { Save, ArrowLeft } from "lucide-react";

const UpdateHelpDeskProfile = () => {
  const [form, setForm] = useState({ name: "", email: "", mobile: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await helpdeskService.me();
        setForm({
          name: res.name || "",
          email: res.email || "",
          mobile: res.mobile || "",
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
      const payload = {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
      };
      await helpdeskService.updateMe(payload);
      toast.success("Profile updated");
      navigate('/helpdesk/profile');
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate('/helpdesk/profile')}
        className="hover:opacity-80 mb-6 flex items-center gap-2 transition-colors"
        style={{ color: 'var(--secondary-color)' }}
      >
        <ArrowLeft size={20} /> Back to Profile
      </button>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>Edit Profile</h1>

      <form onSubmit={handleSubmit} className="p-8 rounded-xl border space-y-6 shadow-xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div>
          <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none transition-colors"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none transition-colors"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Mobile Number</label>
          <input
            type="tel"
            value={form.mobile}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setForm({ ...form, mobile: val });
            }}
            className="w-full p-3 rounded-lg border focus:border-blue-500 outline-none transition-colors"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
            placeholder="Enter 10-digit mobile number"
          />
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

export default UpdateHelpDeskProfile;
