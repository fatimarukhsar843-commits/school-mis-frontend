import { useState, useEffect, useRef } from "react"
import { Outlet, Link, useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { useBranding } from "./BrandingContext"
import { getTeacherByLoginEmail } from "./Teachers"

// Menu items per role — add more later as you build each section
const menuByRole = {
  admin: [
    { label: "Dashboard", path: "/admin" },
    { label: "Students", path: "/admin/students" },
    { label: "Teachers", path: "/admin/teachers" },
    { label: "Class Teachers", path: "/admin/class-teachers" },
    { label: "Parent Logins", path: "/admin/parent-logins" },
    { label: "Admin Accounts", path: "/admin/admin-accounts" },
    { label: "Timetable", path: "/admin/timetable" },
    { label: "Substitution", path: "/admin/substitution" },
    { label: "Results", path: "/admin/results" },
    { label: "Exams", path: "/admin/exams" },
    { label: "Attendance Report", path: "/admin/attendance-report" },
    { label: "Fee Structure", path: "/admin/fee-structure" },
    { label: "Fees", path: "/admin/fees" },
    { label: "Branding", path: "/admin/branding" },
    { label: "Classes & Sections", path: "/admin/classes-sections" },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher" },
    { label: "My Classes", path: "/teacher/classes" },
    { label: "Attendance", path: "/teacher/attendance" },
    { label: "Exams", path: "/teacher/exams" },
    { label: "Subjects", path: "/teacher/subjects" },
    { label: "Enter Marks", path: "/teacher/marks-entry" },
    { label: "Class Results", path: "/teacher/class-results" },
  ],
  parent: [
    { label: "Dashboard", path: "/parent" },
    { label: "Attendance", path: "/parent/attendance" },
    { label: "Fees", path: "/parent/fees" },
  ],
}

// Pages that only a class teacher should see in the sidebar
const classTeacherOnly = ["/teacher/exams", "/teacher/subjects", "/teacher/class-results"]

function LogoIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { branding } = useBranding()
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isClassTeacher, setIsClassTeacher] = useState(false)
  const accountRef = useRef(null)

  // For teachers: find out if they are a class teacher
  useEffect(() => {
    async function check() {
      if (user?.role === "teacher") {
        const t = await getTeacherByLoginEmail(user.email)
        setIsClassTeacher(Boolean(t?.classTeacherOf))
      }
    }
    check()
  }, [user])

  // Close the account card when clicking anywhere outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleLogout() {
    setShowProfile(false)
    logout()
    navigate("/login")
  }

  // Teachers who are not a class teacher don't get the class-teacher-only pages
  let menuItems = user ? menuByRole[user.role] || [] : []
  if (user?.role === "teacher" && !isClassTeacher) {
    menuItems = menuItems.filter((item) => !classTeacherOnly.includes(item.path))
  }

  const roleLabel =
    user?.role === "teacher"
      ? isClassTeacher ? "Class Teacher" : "Subject Teacher"
      : user?.role === "admin"
      ? "Admin"
      : "Parent"

  const initial = user?.name?.[0]?.toUpperCase() || "?"

  return (
    <div className="flex min-h-screen relative">
      {/* Watermark — fixed to the whole viewport, behind everything */}
      <div className="pointer-events-none select-none fixed inset-0 flex items-center justify-center opacity-[0.05] z-0">
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt=""
            className="w-[40rem] h-[40rem] object-contain"
          />
        ) : (
          <LogoIcon className="w-[40rem] h-[40rem]" />
        )}
      </div>

      {/* Sidebar */}
      <aside
        className="w-64 text-white flex flex-col relative z-10"
        style={{ backgroundColor: branding.sidebarColor }}
      >
        <button
          onClick={() => setShowLogoPreview(true)}
          className="p-4 flex items-center gap-3 border-b border-white/20 hover:bg-white/10 transition text-left"
        >
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="School logo"
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          ) : (
            <LogoIcon className="w-8 h-8 text-white flex-shrink-0" />
          )}
          <span className="text-xl font-semibold truncate">{branding.schoolName}</span>
        </button>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-3 py-2 rounded hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Account icon — bottom corner of the sidebar */}
        <div ref={accountRef} className="relative border-t border-white/20 p-3">
          {showProfile && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4 flex items-center gap-3 border-b">
                <div className="w-12 h-12 rounded-full bg-cyan-600 text-white font-semibold text-xl flex items-center justify-center flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-cyan-700 font-medium">{roleLabel}</p>
                </div>
              </div>

              <div className="p-4 text-sm space-y-2">
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="truncate">{user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">School</p>
                  <p className="truncate">{branding.schoolName}</p>
                </div>
              </div>

              <div className="border-t p-2 flex flex-col">
                <Link
                  to={`/${user?.role}/profile`}
                  onClick={() => setShowProfile(false)}
                  className="px-3 py-2 rounded hover:bg-gray-100 text-sm"
                >
                  My Profile (edit name / password)
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded hover:bg-red-50 text-red-600 text-sm text-left"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowProfile((v) => !v)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition text-left"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-semibold text-lg flex items-center justify-center flex-shrink-0 ring-2 ring-white/40">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-white/70">{roleLabel}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-16 bg-white shadow flex items-center px-6 relative z-10">
          <span className="text-gray-700">
            Welcome, {user?.name}
          </span>
        </header>

        {/* Page content renders here */}
        <main className="flex-1 p-6 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Clicking the sidebar logo opens this full preview */}
      {showLogoPreview && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setShowLogoPreview(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="School logo"
                className="w-48 h-48 mx-auto object-contain mb-4"
              />
            ) : (
              <LogoIcon className="w-48 h-48 mx-auto text-gray-700 mb-4" />
            )}
            <h2 className="text-xl font-semibold">{branding.schoolName}</h2>
            {!branding.logoUrl && (
              <p className="text-sm text-gray-400 mt-2">
                No logo uploaded yet — this is the default placeholder.
              </p>
            )}
            <button
              onClick={() => setShowLogoPreview(false)}
              className="mt-5 px-5 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout