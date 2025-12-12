import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { logoutUser, getActiveUser } from "../../api/authservices/authservice";
import helpdeskService from "../../api/helpdesk/helpdeskService";
import Sidebar from "../../components/slidebar/Sidebar";
import { Menu, Bell, Sun, Moon, User } from "lucide-react";
import NotificationBell from "../../components/NotificationBell";
import { getInitials, getColor } from "../../utils/avatarUtils";

const HelpDesk = () => {
  const navigate = useNavigate();
  // Initialize with localStorage data, but will update from API
  const [activeUser, setActiveUser] = useState(getActiveUser() || { name: "HelpDesk", role: "helpdesk" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Fetch fresh profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await helpdeskService.me();
        if (res) {
          setActiveUser(prev => ({ ...prev, ...res }));
        }
      } catch (err) {
        console.error("Failed to fetch helpdesk profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const currentUser = getActiveUser();
    await logoutUser(currentUser ? currentUser.id : null);
    navigate("/login");
  };

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
    window.dispatchEvent(new Event("themeChange"));
  };

  const helpDeskMenu = [
    { icon: "/dashboard.png", label: "Dashboard", path: "/helpdesk" },
    { icon: "/assets/app.png", label: "Manage Appointments", path: "/helpdesk/appointments" },
    { icon: "/assets/user.png", label: "My Profile", path: "/helpdesk/profile" },
    { icon: "/assets/mail.png", label: "Messages", path: "/helpdesk/messages" },
    { icon: "/assets/doctor.png", label: "Add Doctor", path: "/helpdesk/create-doctor" },
    { icon: "/assets/app.png", label: "Leaves", path: "/helpdesk/leaves" },
    { icon: "/assets/help.png", label: "Support & Feedback", path: "/helpdesk/support" },
  ];

  const sidebarTheme = {
    sidebarBg: "bg-white",
    navBg: "bg-white",
    pageBg: "bg-[#f5f7fa]",
    border: "border-gray-200",
    activeBg: "bg-blue-100 text-blue-700",
    hoverBg: "hover:bg-gray-100 hover:text-black",
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-color)] text-[var(--text-color)]">
      {/* Sidebar */}
      <Sidebar
        menu={helpDeskMenu}
        user={activeUser}
        theme={sidebarTheme}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[var(--card-bg)] border-b border-[var(--border-color)] z-30 flex items-center justify-between px-4 lg:px-6 transition-all duration-300">
        {/* Left: Mobile Menu & Title */}
        <NavLink to="/helpdesk">
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
            className="p-2 rounded-lg  dark:hover:bg-gray-800 transition-colors text-[var(--text-color)]"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <NotificationBell />

          <div
            className="flex items-center gap-3 cursor-pointer pl-2 sm:pl-4 sm:border-l border-[var(--border-color)]"
            onClick={() => navigate('/helpdesk/profile')}
          >
            <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${activeUser.avatar ? 'border-blue-500' : 'border-transparent'}`}>
              {activeUser.avatar && activeUser.avatar !== "/avatar.png" ? (
                <img src={activeUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xs ${getColor(activeUser.name || 'HelpDesk')}`}>
                  {getInitials(activeUser.name || 'HelpDesk')}
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

      {/* Main Content */}
      <div className="lg:ml-54 pt-16 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HelpDesk;