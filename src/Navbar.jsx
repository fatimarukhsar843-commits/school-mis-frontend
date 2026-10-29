import { useState } from "react";
import { Search, Bell, User, ChevronDown, LogOut } from "lucide-react";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    "Fee due for 3 students in Class 8-A",
    "Attendance not marked for Class 6-B today",
    "New admission request pending approval",
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left: School name */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-800">School MIS</span>
      </div>

      {/* Center: Search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students, teachers..."className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative text-gray-600 hover:text-gray-900"
          >
            <Bell size={22} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {notifications.length}
            </span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
              <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                Notifications
              </p>
              {notifications.map((note, i) => (
                <div
                  key={i}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="hidden sm:block text-sm font-medium">Admin</span>
            <ChevronDown size={16} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Profile
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}