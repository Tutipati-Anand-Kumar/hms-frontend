import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../../../api/doctors/doctorService";
import {
  User, Mail, Calendar, MapPin, Activity, Edit, Phone, Clock, Stethoscope, Award, Briefcase
} from "lucide-react";
import { getInitials, getColor } from "../../../utils/avatarUtils";

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyProfile();
        setProfile(res);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  if (!profile) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const userName = profile.user?.name || profile.name || 'Doctor';

  const getExperienceString = () => {
    if (profile.experience) return profile.experience;
    if (!profile.experienceStart) return "Not specified";

    const start = new Date(profile.experienceStart);
    const now = new Date();
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) totalMonths -= 1;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years <= 0 && months <= 0) return 'Less than a month';
    if (years > 0 && months > 0) return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <div className="h-full w-full md:p-8 overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Compact Header */}
        <div className="rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          {/* Avatar */}
          <div className="shrink-0">
            {profile.profilePic || profile.user?.avatar ? (
              <img
                src={profile.profilePic || profile.user?.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 object-cover shadow-lg"
                style={{ borderColor: 'var(--bg-color)' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : (
              <div className={`w-24 h-24 rounded-full border-4 border-[#0f172a] flex items-center justify-center text-3xl font-bold text-white shadow-lg ${getColor(userName)}`}>
                {getInitials(userName)}
              </div>
            )}
            {/* Fallback for error handling on img tag above */}
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg ${getColor(userName)} hidden`} style={{ borderColor: 'var(--bg-color)' }}>
              {getInitials(userName)}
            </div>
          </div>

          {/* Name & Role */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>
              {userName}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3 text-sm" style={{ color: 'var(--secondary-color)' }}>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize text-xs font-medium">
                Doctor
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                ID: {profile.user?.doctorId || '-'}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => navigate('/doctor/profile/edit')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-all flex items-center gap-2 active:scale-95 text-sm"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Professional Information */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <Activity className="text-blue-400" size={20} />
            Professional Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              icon={Stethoscope}
              label="Specialties"
              value={Array.isArray(profile.specialties) ? profile.specialties.join(", ") : "-"}
              color="text-purple-400"
              bgColor="bg-purple-400/10"
              fullWidth
            />
            <InfoItem
              icon={Award}
              label="Qualifications"
              value={Array.isArray(profile.qualifications) ? profile.qualifications.join(", ") : "-"}
              color="text-amber-400"
              bgColor="bg-amber-400/10"
            />
            <InfoItem
              icon={Briefcase}
              label="Experience"
              value={getExperienceString()}
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
            />
            <InfoItem
              icon={Activity}
              label="Consultation Fee"
              value={profile.hospitals?.[0]?.consultationFee ? `₹${profile.hospitals[0].consultationFee}` : "-"}
              color="text-blue-400"
              bgColor="bg-blue-400/10"
            />
          </div>
        </div>

        {/* Bio Section */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <User className="text-blue-400" size={20} />
            About Me
          </h3>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-color)' }}>
            {profile.bio || <span className="italic" style={{ color: 'var(--secondary-color)', opacity: 0.6 }}>No biography provided.</span>}
          </p>
        </div>

        {/* Contact Information */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <User className="text-blue-400" size={20} />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              icon={Mail}
              label="Email Address"
              value={profile.user?.email || profile.email}
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
            />
            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={profile.user?.mobile || profile.mobile}
              color="text-violet-400"
              bgColor="bg-violet-400/10"
            />
          </div>
        </div>

        {/* Availability */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <Calendar className="text-blue-400" size={20} />
            Availability
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {profile.hospitals?.[0]?.availability && profile.hospitals[0].availability.length > 0 ? (
              profile.hospitals[0].availability.map((a, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', opacity: 0.8 }}>
                  <span className="font-semibold min-w-[100px]" style={{ color: 'var(--text-color)' }}>
                    {Array.isArray(a.days) ? a.days.join(", ") : a.day || '-'}:
                  </span>
                  <span style={{ color: 'var(--text-color)' }}>
                    {a.startTime && a.endTime ? (
                      <span>
                        {a.startTime} - {a.endTime}
                        {a.breakStart && a.breakEnd && <span className="text-sm opacity-70 ml-2">(Break: {a.breakStart} - {a.breakEnd})</span>}
                      </span>
                    ) : (
                      Array.isArray(a.slots) ? a.slots.join(' | ') : '-'
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="italic" style={{ color: 'var(--secondary-color)' }}>No availability set</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, color, bgColor, fullWidth }) => (
  <div className={`${fullWidth ? 'md:col-span-2' : ''} flex items-start gap-4 p-3 rounded-xl transition-colors`} style={{ backgroundColor: 'var(--bg-color)', opacity: 0.5 }}>
    <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--secondary-color)' }}>{label}</p>
      <p className="font-medium text-sm md:text-base break-words" style={{ color: 'var(--text-color)' }}>
        {value || <span className="italic" style={{ color: 'var(--secondary-color)', opacity: 0.6 }}>Not provided</span>}
      </p>
    </div>
  </div>
);

export default DoctorProfile;
