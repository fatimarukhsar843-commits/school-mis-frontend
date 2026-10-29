import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail } from "./Teachers"
import { getStudents } from "./Students"

const API = "http://localhost:5000/api/profile"

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  )
}

function Profile() {
  const { user, login } = useAuth()

  const [teacher, setTeacher] = useState(null)
  const [children, setChildren] = useState([])

  const [name, setName] = useState(user?.name || "")
  const [nameMessage, setNameMessage] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState({ text: "", ok: false })

  // Extra details depend on the role
  useEffect(() => {
    async function load() {
      if (user?.role === "teacher") {
        setTeacher((await getTeacherByLoginEmail(user.email)) || null)
      }
      if (user?.role === "parent") {
        const all = await getStudents()
        setChildren(
          all.filter((s) => (s.parentEmail || "").toLowerCase() === user.email.toLowerCase())
        )
      }
    }
    load()
  }, [user?.email, user?.role])

  async function handleSaveName() {
    if (!name.trim()) return
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name }),
      })
      if (!res.ok) throw new Error()
      login({ ...user, name: name.trim() }) // updates the name shown at the top
      setNameMessage("Saved!")
    } catch {
      setNameMessage("Could not save. Please try again.")
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordMessage({ text: "New password must be at least 6 characters.", ok: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "The two new passwords don't match.", ok: false })
      return
    }
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPasswordMessage({ text: data.message || "Could not change password.", ok: false })
        return
      }
      setPasswordMessage({ text: "Password changed!", ok: true })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setPasswordMessage({ text: "Could not change password.", ok: false })
    }
  }

  const roleLabel =
    user?.role === "teacher"
      ? teacher?.classTeacherOf
        ? `Class Teacher (Class ${teacher.classTeacherOf})`
        : "Subject Teacher"
      : user?.role === "admin"
      ? "Admin"
      : "Parent"

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-cyan-600 text-white flex items-center justify-center text-2xl font-semibold">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-500">{roleLabel}</p>
            </div>
          </div>

          <Row label="Email" value={user?.email} />
          <Row label="Role" value={roleLabel} />
          {user?.role === "teacher" && <Row label="Phone" value={teacher?.phone} />}
          {user?.role === "teacher" && !teacher && (
            <p className="text-sm text-yellow-700 mt-2">
              Your login isn't linked to a teacher record yet. Ask the admin to check your Login Email.
            </p>
          )}

          {user?.role === "parent" && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-1">My Children</p>
              {children.length === 0 ? (
                <p className="text-sm text-gray-400">No children linked to this email yet.</p>
              ) : (
                <ul className="space-y-1">
                  {children.map((c) => (
                    <li key={c._id} className="bg-gray-50 rounded px-3 py-2 text-sm">
                      {c.name} <span className="text-gray-500">— Class {c.className}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Edit name + change password */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Change Name</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameMessage("") }}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleSaveName}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
              >
                Save
              </button>
            </div>
            {nameMessage && <p className="text-sm text-gray-600 mt-2">{nameMessage}</p>}
          </div>

          <form onSubmit={handleChangePassword} className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="font-semibold">Change Password</h2>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="New password (at least 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              Change Password
            </button>
            {passwordMessage.text && (
              <p className={`text-sm ${passwordMessage.ok ? "text-green-600" : "text-red-500"}`}>
                {passwordMessage.text}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile