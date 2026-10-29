import { useState, useEffect } from "react"
import { getTeachers, deleteTeacher } from "./Teachers"
import { getUsers, deleteLoginByEmail } from "./Accounts"
import TeacherForm from "./TeacherForm"

function TeacherList() {
  const [teachers, setTeachers] = useState([])
  const [loginEmails, setLoginEmails] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)

  async function refresh() {
    setTeachers(await getTeachers())
    const users = await getUsers("teacher")
    setLoginEmails(users.map((u) => u.email.toLowerCase()))
  }

  useEffect(() => {
    refresh()
  }, [])

  function hasLogin(email) {
    return loginEmails.includes((email || "").toLowerCase())
  }

  function handleAddClick() {
    setEditingTeacher(null)
    setShowForm(true)
  }
  function handleEditClick(teacher) {
    setEditingTeacher(teacher)
    setShowForm(true)
  }

  async function handleDeleteClick(id) {
    const t = teachers.find((x) => x._id === id)
    if (confirm("Delete this teacher? Their login will be removed too.")) {
      await deleteTeacher(id)
      if (t?.loginEmail) {
        await deleteLoginByEmail(t.loginEmail, "teacher").catch(() => {})
      }
      refresh()
    }
  }

  function handleFormClose() {
    setShowForm(false)
    refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <button
          onClick={handleAddClick} className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
          + Add Teacher
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Login Email</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t._id} className="border-t">
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3">{t.phone}</td>
                <td className="px-4 py-3">{t.loginEmail}</td>
                <td className="px-4 py-3">
                  {hasLogin(t.loginEmail) ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">No login yet</span>
                  )}
                </td>
                <td className="px-4 py-3">Rs. {t.salary?.toLocaleString()}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => handleEditClick(t)} className="text-cyan-600 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(t._id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No teachers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <TeacherForm teacher={editingTeacher} onClose={handleFormClose} />
      )}
    </div>
  )
}

export default TeacherList