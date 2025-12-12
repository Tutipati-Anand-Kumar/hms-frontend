import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../../api/admin/adminServices";
import { Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const UpdateAdminProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || ""
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
        toast.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      if (/^\d{0,10}$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile(formData);
      toast.success("Profile updated successfully!");
      navigate("/admin/profile");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 transition-colors hover:text-blue-500" style={{ color: 'var(--secondary-color)' }}>
        <ArrowLeft size={20} /> Back to Profile
      </button>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>Edit Profile</h1>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-xl border shadow-lg space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div>
          <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border outline-none focus:border-blue-500 transition-colors"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border outline-none focus:border-blue-500 transition-colors"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Mobile Number (10 digits)</label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border outline-none focus:border-blue-500 transition-colors"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default UpdateAdminProfile;
