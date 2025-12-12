// components/layout/Navbar.js
import React from "react";
import { Search, Menu } from "lucide-react";

export default function Navbar({ theme, onMenuToggle }) {
  return (
    <div className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-[#1e293b] border-b border-gray-700 flex items-center justify-between px-4 md:px-6 z-30">

      {/* Hamburger (visible on mobile only) */}
      <button
        className="md:hidden text-gray-200"
        onClick={onMenuToggle}
      >
        <Menu size={26} />
      </button>

      {/* Search Bar (hidden on small screens) */}
      <div className="relative w-64 hidden md:block">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0f172a] border border-gray-700 text-gray-200"
        />
      </div>
    </div>
  );
}
