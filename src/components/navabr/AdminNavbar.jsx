import { Search, Bell, Menu, Sun, Moon, User } from "lucide-react";
import NotificationBell from "../NotificationBell";
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { getInitials, getColor } from "../../utils/avatarUtils";

const AdminNavbar = ({
    searchPlaceholder = "Search...",
    onSearch,
    filters = [],
    onFilterChange,
    onMenuClick,
    user
}) => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
        } else {
            root.removeAttribute("data-theme");
        }
        localStorage.setItem("theme", theme);

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new Event('themeChange'));
    }, [theme]);

    // Listen for theme changes from other components
    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = localStorage.getItem("theme") || "dark";
            setTheme(currentTheme);
        };

        window.addEventListener('themeChange', handleThemeChange);
        window.addEventListener('storage', handleThemeChange);

        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <div className="h-16 bg-[var(--navbar-bg)] border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 gap-4 transition-colors duration-300">

            {/* Mobile Menu & Brand (Visible on small screens) */}
            <div className="flex items-center gap-3 lg:hidden shrink-0">
                <NavLink to={
                    user?.role === "super-admin" ? "/admin" :
                        user?.role === "patient" ? "/home" : "/"
                }>
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="w-20 h-20 max-sm:hidden  max-lg:w-10 max-lg:h-10 object-contain" />
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text">
                            MScurechain
                        </h1>
                    </div>
                </NavLink>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl max-sm:hidden max-lg:hidden">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                        className="w-full bg-[var(--card-bg)] text-[var(--text-color)] pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-2 lg:gap-4 ml-auto shrink-0">

                {/* Dynamic Filters - Hidden on very small screens if needed, or styled compactly */}
                {filters.map((filter, index) => (
                    <div key={index} className="relative hidden sm:block">
                        <select
                            onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
                            className="bg-[var(--card-bg)] text-[var(--text-color)] text-sm px-3 py-2 rounded-lg border border-[var(--border-color)] focus:border-purple-500 outline-none appearance-none cursor-pointer hover:border-gray-500 transition-colors"
                        >
                            <option value="">{filter.label}</option>
                            {filter.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:text-[var(--primary-color)] transition-colors"
                >
                    {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="h-8 w-px bg-gray-700 mx-2 hidden sm:block" />

                <NotificationBell />

                {/* User Profile */}
                {user && (
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-[var(--card-bg)] p-2 rounded-lg transition-colors border border-transparent hover:border-[var(--border-color)]"
                        onClick={() => {
                            if (user.role === 'patient') navigate('/home/patient/profile');
                            else if (user.role === 'doctor') navigate('/doctor/profile');
                            else if (user.role === 'admin' || user.role === 'super-admin') navigate('/admin/profile');
                            else if (user.role === 'helpdesk') navigate('/helpdesk/profile');
                        }}
                    >
                        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-[var(--border-color)] ${!user.avatar || user.avatar === "/avatar.png" ? getColor(user.name) : ""}`}>
                            {user.avatar && user.avatar !== "/avatar.png" ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-medium text-xs">{getInitials(user.name)}</span>
                            )}
                        </div>

                    </div>
                )}

                {/* Mobile Menu Button - Right Side */}
                <button
                    onClick={onMenuClick}
                    className="p-2 text-gray-400 hover:text-[var(--text-color)] hover:bg-[var(--card-bg)] rounded-lg transition-colors lg:hidden"
                >
                    <Menu size={24} />
                </button>
            </div>
        </div>
    );
};

export default AdminNavbar;
