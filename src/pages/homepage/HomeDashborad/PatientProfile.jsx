import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../../api/patients/patientService";
import {
  User, Mail, Calendar, MapPin, Activity, Edit, Phone, Clock
} from "lucide-react";
import { getInitials, getColor } from "../../../utils/avatarUtils";

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProfile();
        setProfile(res);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-color)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getAge = (dob) => {
    if (!dob) return '-';
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365)) + " Years";
  };

  const userName = profile.user?.name || profile.name || 'Unknown User';

  return (
    <div className="min-h-screen w-full bg-[var(--bg-color)]  mt-20 max-sm:mt-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Compact Header */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-2 border border-[var(--border-color)] shadow-xl flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-[var(--bg-color)] object-cover shadow-lg"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full border-4 border-[var(--bg-color)] flex items-center justify-center text-3xl font-bold text-white shadow-lg ${getColor(userName)}`}>
                {getInitials(userName)}
              </div>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-[var(--text-color)] mb-1">
              {userName}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3 text-[var(--secondary-color)] text-sm">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize text-xs font-medium">
                {profile.user?.role || 'Patient'}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => navigate('/home/patient/profile/edit')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-all flex items-center gap-2 active:scale-95 text-sm"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Personal Information Only */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)] shadow-xl">
          <h3 className="text-lg font-semibold text-[var(--text-color)] mb-6 flex items-center gap-2">
            <User className="text-blue-400" size={20} />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
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
              <InfoItem
                icon={MapPin}
                label="Address"
                value={profile.address}
                color="text-indigo-400"
                bgColor="bg-indigo-400/10"
              />
              <InfoItem
                icon={User}
                label="Gender"
                value={profile.gender}
                color="text-cyan-400"
                bgColor="bg-cyan-400/10"
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <InfoItem
                icon={Activity}
                label="Age"
                value={getAge(profile.dob)}
                color="text-rose-400"
                bgColor="bg-rose-400/10"
              />
              <InfoItem
                icon={Activity}
                label="Height"
                value={profile.height ? `${profile.height} cm` : null}
                color="text-teal-400"
                bgColor="bg-teal-400/10"
              />
              <InfoItem
                icon={Activity}
                label="Weight"
                value={profile.weight ? `${profile.weight} kg` : null}
                color="text-orange-400"
                bgColor="bg-orange-400/10"
              />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={profile.dob ? new Date(profile.dob).toLocaleDateString() : null}
                color="text-amber-400"
                bgColor="bg-amber-400/10"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, color, bgColor, fullWidth }) => (
  <div className={`${fullWidth ? 'md:col-span-2' : ''} flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--bg-color)]/50 transition-colors`}>
    <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-[var(--secondary-color)] font-medium mb-0.5">{label}</p>
      <p className="text-[var(--text-color)] font-medium text-sm md:text-base break-words">
        {value || <span className="text-gray-600 italic">Not provided</span>}
      </p>
    </div>
  </div>
);

export default PatientProfile;
