import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../components/slidebar/Sidebar";
import AdminNavbar from "../../components/navabr/AdminNavbar";
import useDebounce from "../../hooks/useDebounce";
import { getActiveUser } from "../../api/authservices/authservice";

const adminMenu = [
    { icon: "/dashboard.png", label: "Dashboard", path: "/admin" },
    { icon: "/assets/user.png", label: "All Users", path: "/admin/users" },
    { icon: "/assets/doctor.png", label: "Hospitals", path: "/admin/hospitals" },
    { icon: "/assets/doctor.png", label: "Doctors", path: "/admin/doctors" },
    { icon: "/assets/user.png", label: "Patients", path: "/admin/patients" },
    { icon: "/assets/user.png", label: "Front Desk", path: "/admin/helpdesks" },
    { icon: "/assets/user.png", label: "Create Admin", path: "/admin/create-admin" },
    { icon: "/assets/user.png", label: "Admins", path: "/admin/admins" },
    { icon: "/assets/doctor.png", label: "Create Doctor", path: "/admin/create-doctor" },
    { icon: "/assets/user.png", label: "Create HelpDesk", path: "/admin/create-helpdesk" },
    { icon: "/assets/doctor.png", label: "Create Hospital", path: "/admin/create-hospital" },
    { icon: "/assets/user.png", label: "Assign Doctor", path: "/admin/assign-doctor" },
    { icon: "/assets/mail.png", label: "Broadcast", path: "/admin/broadcast" },
    { icon: "/assets/reports.png", label: "Audit Logs", path: "/admin/audits" },
    { icon: "/assets/help.png", label: "Support & Feedback", path: "/support" },
];

const adminTheme = {
    sidebarBg: "bg-[#0f172a]",
    navBg: "bg-[#1e293b]",
    pageBg: "bg-[#0f172a]",
    border: "border-gray-800",
    activeBg: "bg-blue-600 text-white shadow-lg shadow-blue-900/20",
    hoverBg: "hover:bg-gray-800 hover:text-white",
};



const AdminLayout = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search

    // Get active user
    const user = getActiveUser();
    const adminUser = user || {
        name: "Super Admin",
        role: "Super Admin",
        avatar: null, // Let utils handle fallback
    };

    // Debug logs
    console.log("AdminLayout - Raw Search:", searchQuery);
    console.log("AdminLayout - Debounced Search:", debouncedSearchQuery);
    const [filters, setFilters] = useState([]); // Array of { key, label, options }
    const [activeFilters, setActiveFilters] = useState({});
    const [searchPlaceholder, setSearchPlaceholder] = useState("Search...");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleFilterChange = (key, value) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <Sidebar
                menu={adminMenu}
                user={adminUser}
                theme={adminTheme}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-55 min-h-screen transition-all duration-300 w-full max-w-full overflow-x-hidden">
                <AdminNavbar
                    searchPlaceholder={searchPlaceholder}
                    onSearch={setSearchQuery}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    user={adminUser}
                />

                <div className="p-4 max-[600px]:p-2 flex-1 overflow-y-auto">
                    {/* Pass context to child pages so they can set navbar state */}
                    <Outlet context={{
                        searchQuery: debouncedSearchQuery, // Pass debounced value
                        setSearchPlaceholder,
                        setFilters,
                        activeFilters
                    }} />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
