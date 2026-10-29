import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getUsers, createUser, updateUser, deleteUser } from "./Accounts"

function AdminAccounts() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState("")

  async function refresh() {
    setAdmins(await getUsers("admin"))
  }

  useEffect(() => {
    refresh()
  }, [])

  function resetForm() {
    setName("")
    setEmail("")
    setPassword("")
    setEditingId(null)
    setError("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    try {
      if (editingId) {
        const updates = { name, email }
        if (password) updates.password = password // only change password if a new one was typed
        await updateUser(editingId, updates)
      } else {
        await createUser({ name, email, password, role: "admin" })
      }
      resetForm()
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleEdit(admin) {
    setEditingId(admin._id)
    setName(admin.name)
    setEmail(admin.email)
    setPassword("")
    setError("")
  }

  async function handleDelete(id) {
    if (!confirm("Remove this admin account?")) return
    try {
      await deleteUser(id)
      if (editingId === id) resetForm()
      refresh()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Accounts</h1>
      <p className="text-gray-500 mb-4">
        Add additional admin logins for other staff who need full access
        (e.g. a second office administrator).
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a._id} className="border-t">
                <td className="px-4 py-3">
                  {a.name}
                  {a.email === user?.email && (
                    <span className="ml-2 text-xs text-cyan-700">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(a)} className="text-cyan-600 hover:underline text-sm">
                    Edit
                  </button>
                  {a.email !== user?.email && (
                    <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:underline text-sm">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  No admin accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-3">
          {editingId ? "Edit Admin" : "Add New Admin"}
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
            type="email"
            placeholder="Login Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder={editingId ? "New Password (leave blank to keep current)" : "Password (at least 6 characters)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editingId}
            autoComplete="new-password"
            className="w-full p-2 border rounded"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              {editingId ? "Save Changes" : "Add Admin"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminAccounts