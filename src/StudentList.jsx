import { useState, useEffect } from "react"
import { getStudents, deleteStudent } from "./Students"
import { getClassList } from "./Classes"
import StudentForm from "./StudentForm"

function StudentList() {
  const classOptions = ["All", ...getClassList()]

  const [students, setStudents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [classFilter, setClassFilter] = useState("All")

  async function refresh() {
    const data = await getStudents()
    setStudents(data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const classOrder = getClassList()

  // Filter by class, then sort by class and roll number
  const visibleStudents = (
    classFilter === "All"
      ? students
      : students.filter((s) => s.className === classFilter)
  )
    .slice()
    .sort((a, b) => {
      const byClass = classOrder.indexOf(a.className) - classOrder.indexOf(b.className)
      if (byClass !== 0) return byClass
      return (parseInt(a.rollNo, 10) || 0) - (parseInt(b.rollNo, 10) || 0)
    })

  function handleAddClick() {
    setEditingStudent(null)
    setShowForm(true)
  }

  function handleEditClick(student) {
    setEditingStudent(student)
    setShowForm(true)
  }

  async function handleDeleteClick(id) {
    if (confirm("Delete this student?")) {
      await deleteStudent(id)
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
        <h1 className="text-2xl font-semibold">Students</h1>
        <div className="flex items-center gap-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Classes" : `Class ${c}`}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
          >
            + Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Reg. No</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Father / Guardian</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 font-semibold flex items-center justify-center flex-shrink-0">
                        {s.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span>{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{s.regNo || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">{s.className}</td>
                <td className="px-4 py-3">{s.rollNo}</td>
                <td className="px-4 py-3">{s.guardian}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => handleEditClick(s)}
                    className="text-cyan-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(s._id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {visibleStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No students yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <StudentForm student={editingStudent} onClose={handleFormClose} />
      )}
    </div>
  )
}

export default StudentList