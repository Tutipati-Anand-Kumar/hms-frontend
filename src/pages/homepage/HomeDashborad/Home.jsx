import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../../components/slidebar/Sidebar";
import AdminNavbar from "../../../components/navabr/AdminNavbar";
import { getProfile } from "../../../api/patients/patientService";
import useDebounce from "../../../hooks/useDebounce";


const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search by 500ms
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState({
    name: "",
    role: "patient",
    avatar: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setUser({
          name: data.name || data.user?.name || "Patient",
          role: "patient",
          avatar: data.avatar || data.user?.avatar || ""
        });
      } catch (error) {
        console.error("Failed to fetch patient profile", error);
      }
    };
    fetchProfile();
  }, []);

  const onLogout = () => {
    navigate("/login");
  };

  const patientMenu = [
    { icon: "/dashboard.png", label: "Dashboard", path: "/home" },
    { icon: "/assets/app.png", label: "Appointments", path: "appointments" },
    { icon: "/assets/reports.png", label: "Medical Records", path: "records" },
    { icon: "/assets/ai.png", label: "AI Symptom Checker", path: "aisymptomchecker" },
    { icon: "/assets/prescription.png", label: "Prescriptions", path: "prescriptions" },
    { icon: "/assets/biiling.png", label: "Billing", path: "billing" },
    { icon: "/assets/help.png", label: "Support & Feedback", path: "/home/support" },
  ];

  // Using CSS variables for theming
  const patientTheme = {
    sidebarBg: "bg-[var(--sidebar-bg)]",
    navBg: "bg-[var(--navbar-bg)]",
    pageBg: "bg-[var(--bg-color)]",
    border: "border-[var(--border-color)]",
    activeBg: "bg-[var(--primary-color)] text-white shadow-lg shadow-blue-900/20",
    hoverBg: "hover:bg-[var(--card-bg)] hover:text-[var(--text-color)]",
  };

  // Dynamic placeholder based on current route
  const getSearchPlaceholder = () => {
    if (location.pathname.includes("/home/prescriptions")) return "Search for prescriptions...";
    if (location.pathname.includes("/home/appointments")) return "Search for appointments...";
    return "Search...";
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] hide-scrollbar">


      {/* Sidebar */}
      <Sidebar
        menu={patientMenu}
        user={user}
        theme={patientTheme}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-55 min-h-screen transition-all duration-300">
        <AdminNavbar
          user={user}
          searchPlaceholder={getSearchPlaceholder()}
          onSearch={setSearchQuery} // Updates raw state immediately for UI responsiveness
          filters={[]}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="p-2 flex-1 overflow-y-auto">
          {/* Pass DEBOUNCED query to children to trigger filtering/API calls only after delay */}
          <Outlet context={{ searchQuery: debouncedSearchQuery }} />
        </div>


      </div>
    </div>
  );
};

export default Home;