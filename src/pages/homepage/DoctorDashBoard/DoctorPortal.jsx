import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/slidebar/Sidebar";
import { getMyProfile } from "../../../api/doctors/doctorService";
import { Menu, Sun, Moon, User } from "lucide-react";
import NotificationBell from "../../../components/NotificationBell";
import SelectionNavbar from "../../../components/navabr/SelectionNavbar";

const doctorMenu = [
  { icon: "/dashboard.png", label: "Dashboard", path: "/doctor" },

  { icon: "/assets/patient.png", label: "Patients", path: "/doctor/patients" },
  { icon: "/assets/appointment.png", label: "Appointments", path: "/doctor/appointments" },
  { icon: "/assets/prescription.png", label: "Prescription", path: "/doctor/prescription" },
  { icon: "/assets/help.png", label: "Front Desk", path: "/doctor/frontdesk" },
  { icon: "/assets/ana.png", label: "Analytics", path: "/doctor/analytics" },
  { icon: "/assets/leave.png", label: "Leaves", path: "/doctor/leaves" },
  { icon: "/assets/help.png", label: "Support & Feedback", path: "/doctor/support" },
];

const doctorTheme = {
  sidebarBg: "bg-white",
  navBg: "bg-white",
  pageBg: "bg-[#f5f7fa]",
  border: "border-gray-200",
  activeBg: "bg-blue-100 text-blue-700",
  hoverBg: "hover:bg-gray-100 hover:text-black",
};

export default function DoctorPortal() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [doctorUser, setDoctorUser] = useState({
    name: "Doctor",
    role: "Specialty",
    avatar: "/avatar.png",
  });

  // Navbar Configuration Context
  const [navbarConfig, setNavbarConfig] = useState({
    type: "default", // 'default' | 'selection'
    count: 0,
    actions: {} // { onClear, onEdit, onCopy, ... }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        console.log("Fetched Doctor Profile:", res);
        setDoctorUser({
          name: res.user?.name || "Doctor",
          role: "Doctor",
          avatar: res.profilePic || res.user?.avatar || "/avatar.png",
        });
      } catch (err) {
        console.error("Failed to fetch doctor profile", err);
      }
    };
    fetchProfile();
  }, []);

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    // Dispatch event for other components
    window.dispatchEvent(new Event("themeChange"));
  };

  return (
    <div className="h-full w-full bg-[var(--bg-color)] text-[var(--text-color)]">
      {/* Sidebar */}
      <Sidebar
        menu={doctorMenu}
        user={doctorUser}
        theme={doctorTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Render Appropriate Navbar */}
      {navbarConfig.type === 'selection' ? (
        <SelectionNavbar
          count={navbarConfig.count}
          onClear={navbarConfig.actions.onClear}
          onEdit={navbarConfig.actions.onEdit}
          onCopy={navbarConfig.actions.onCopy}
          onSelectAll={navbarConfig.actions.onSelectAll}
          onDelete={navbarConfig.actions.onDelete}
          canEdit={navbarConfig.actions.canEdit}
        />
      ) : (
        /* Fixed Navbar (Default) */
        <div className="fixed top-0 left-0 right-0 h-16 bg-[var(--card-bg)] border-b border-[var(--border-color)] z-30 flex items-center justify-between px-4 lg:px-6 transition-all duration-300">
          {/* Left: Mobile Menu & Title */}
          <NavLink to="/doctor">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent lg:hidden">
                MScurechain
              </h1>
            </div>
          </NavLink>
          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg dark:hover:bg-gray-800 transition-colors text-[var(--text-color)]"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationBell />

            <div
              className="flex items-center gap-3 cursor-pointer pl-2 sm:pl-4 sm:border-l border-[var(--border-color)]"
              onClick={() => navigate('/doctor/profile')}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500">
                {doctorUser.avatar && doctorUser.avatar !== "/avatar.png" ? (
                  <img src={doctorUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <User size={18} className="text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-54 pt-16 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-6 max-[650px]:p-2">
          <Outlet context={{ setNavbarConfig }} />
        </div>
      </div>
    </div>
  );
}
