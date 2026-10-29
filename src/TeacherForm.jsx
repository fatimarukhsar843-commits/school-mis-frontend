import { useState } from "react"
import { addTeacher, updateTeacher } from "./Teachers"
import { setLogin, deleteLoginByEmail } from "./Accounts"

// If `teacher` is passed in, we're editing. If it's null, we're adding new.
function TeacherForm({ teacher, onClose }) {
  const isEditMode = Boolean(teacher)

  const [name, setName] = useState(teacher?.name || "")
  const [phone, setPhone] = useState(teacher?.phone || "")
  const [salary, setSalary] = useState(teacher?.salary || "")
  const [loginEmail, setLoginEmail] = useState(teacher?.loginEmail || "")
  const [password, setPassword] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()

    const emailChanged = isEditMode && teacher.loginEmail !== loginEmail

    if (!isEditMode && password.length < 6) {
      alert("Please give the teacher a password of at least 6 characters.")
      return
    }
    if (password && password.length < 6) {
      alert("The password must be at least 6 characters.")
      return
    }
    if (emailChanged && !password) {
      alert("You changed the login email, so please also enter a password for the new login.")
      return
    }

    const data = { name, phone, salary: Number(salary), loginEmail }

    try {
      if (isEditMode) {
        await updateTeacher(teacher._id, data)
      } else {
        await addTeacher(data)
      }
    } catch (err) {
      console.error("Failed to save teacher:", err)
      alert("Could not save teacher. Please try again.")
      return
    }

    // Create the login (or reset its password)
    if (password) {
      try {
        await setLogin({ name, email: loginEmail, role: "teacher", password })
        if (emailChanged && teacher.loginEmail) {
          await deleteLoginByEmail(teacher.loginEmail, "teacher").catch(() => {})
        }
      } catch (err) {
        alert(`Teacher saved, but the login could not be created: ${err.message}`)
      }
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {isEditMode ? "Edit Teacher" : "Add Teacher"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Monthly Salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Login Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder={
              isEditMode
                ? "New password (leave blank to keep the current one)"
                : "Password for the teacher's login (at least 6 characters)"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEditMode}
            autoComplete="new-password"
            className="w-full p-2 border rounded"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {isEditMode ? "Save Changes" : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherForm