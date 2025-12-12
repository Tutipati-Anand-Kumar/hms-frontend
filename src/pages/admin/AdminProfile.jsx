import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyProfile } from "../../api/admin/adminServices";
import { User, Mail, Phone, Shield, Edit, Clock } from "lucide-react";
import { getInitials, getColor } from "../../utils/avatarUtils";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!profile) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Profile not found</div>;

  const userName = profile.name || 'Admin';

  return (
    <div className="min-h-screen w-full p-4 md:p-8 overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Compact Header */}
        <div className="rounded-2xl p-6 border shadow-xl flex flex-col md:flex-row items-center gap-6"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 object-cover shadow-lg"
                style={{ borderColor: 'var(--bg-color)' }}
              />
            ) : (
              <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg ${getColor(userName)}`}
                style={{ borderColor: 'var(--bg-color)' }}>
                {getInitials(userName)}
              </div>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>
              {userName}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3 text-sm" style={{ color: 'var(--secondary-color)' }}>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize text-xs font-medium">
                {profile.role || 'Super Admin'}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Active
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => navigate('/admin/profile/edit')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-all flex items-center gap-2 active:scale-95 text-sm"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Contact Information */}
        <div className="rounded-2xl p-6 border shadow-xl"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <User className="text-blue-400" size={20} />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              icon={Mail}
              label="Email Address"
              value={profile.email}
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
            />
            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={profile.mobile}
              color="text-violet-400"
              bgColor="bg-violet-400/10"
            />
            <InfoItem
              icon={Shield}
              label="Role"
              value={profile.role || "Super Admin"}
              color="text-amber-400"
              bgColor="bg-amber-400/10"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, color, bgColor, fullWidth }) => (
  <div className={`${fullWidth ? 'md:col-span-2' : ''} flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-opacity-50`}
    style={{ ':hover': { backgroundColor: 'var(--bg-color)' } }}>
    <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--secondary-color)' }}>{label}</p>
      <p className="font-medium text-sm md:text-base break-words" style={{ color: 'var(--text-color)' }}>
        {value || <span className="italic" style={{ color: 'var(--secondary-color)' }}>Not provided</span>}
      </p>
    </div>
  </div>
);

export default AdminProfile;
