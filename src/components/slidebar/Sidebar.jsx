import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings, X } from "lucide-react";
import { getInitials, getColor } from "../../utils/avatarUtils";
import logo from "../../assets/logo.png";
import ConfirmationModal from "../ConfirmationModal";
import { logoutUser, getActiveUser } from "../../api/authservices/authservice";

const Sidebar = ({ menu, user, theme, onLogout, isOpen, onClose }) => {
  let navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // FILTER OUT settings + logout completely from menu list
  const topMenu = menu.filter(
    (m) =>
      !m.bottom &&
      m.label.toLowerCase() !== "settings" &&
      m.label.toLowerCase() !== "logout"
  );

  const bottomMenu = menu.filter(
    (m) =>
      m.bottom &&
      m.label.toLowerCase() !== "settings" &&
      m.label.toLowerCase() !== "logout"
  );

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    onClose(); // Close sidebar

    if (onLogout) {
      onLogout(); // Parent handles logout logic
    } else {
      // Default logout logic
      const active = getActiveUser();
      // Pass ID if we have it, otherwise pass null - logoutUser handles both
      await logoutUser(active ? active.id : null);
      navigate("/login");
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />

      {/* Overlay for mobile */}
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}

      {/* Conditionally rendered Fixed Toggle Button (X) */}
      {/* This overlays the hamburger menu when sidebar is open */}
      {isOpen && (
        <button
          onClick={onClose}
          className="lg:hidden fixed top-2 right-4 z-50 p-2 text-[var(--secondary-color)] bg-[var(--card-bg)] rounded-md shadow-md hover:text-[var(--text-color)] transition-all"
        >
          <X size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-54 bg-[var(--sidebar-bg)] text-[var(--secondary-color)] flex flex-col z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r border-[var(--border-color)]
      `}>

        {/* BRAND */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)]">
          <NavLink
            to={
              user?.role === "Doctor" ? "/doctor" :
                user?.role === "super-admin" ? "/admin" :
                  user?.role === "helpdesk" ? "/helpdesk" :
                    user?.role === "patient" ? "/home" : "/"
            }
            className="flex items-center gap-3"
          >
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text tracking-wide">
              MScurechain
            </h1>
          </NavLink>

        </div>

        {/* SCROLLABLE MENU AREA */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hide-scrollbar">
          {/* TOP ITEMS */}
          {topMenu.map((item, index) => {
            return (
              <NavLink
                key={index}
                to={item.path}
                end={item.label === "Dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-[var(--card-bg)] hover:text-[var(--text-color)]"
                  }`
                }
              >
                {item.icon && (
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="w-5 h-5 object-contain"
                  />
                )}
                {item.label}
              </NavLink>
            );
          })}

          {/* DIVIDER IF BOTTOM ITEMS EXIST */}
          {bottomMenu.length > 0 && (
            <div className="my-4 border-t border-[var(--border-color)]" />
          )}

          {/* BOTTOM ITEMS (About, etc.) */}
          {bottomMenu.map((item, index) => {
            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-[var(--card-bg)] hover:text-[var(--text-color)]"
                  }`
                }
              >
                {item.icon && (
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="w-5 h-5 object-contain"
                  />
                )}
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* FOOTER (Settings + Logout) */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-2">
          <NavLink
            to={
              user?.role === "Doctor" ? "/doctor/settings" :
                user?.role === "Super Admin" ? "/admin/settings" :
                  user?.role === "helpdesk" ? "/helpdesk/settings" :
                    user?.role === "patient" ? "/home/settings" : "/settings"
            }
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? "bg-blue-600 text-white"
                : "hover:bg-[var(--card-bg)] hover:text-[var(--text-color)]"
              }`
            }
          >
            <Settings size={20} />
            Settings
          </NavLink>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;