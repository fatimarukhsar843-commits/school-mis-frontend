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
  const [search, setSearch] = useState("")

  async function refresh() {
    const data = await getStudents()
    setStudents(data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const classOrder = getClassList()

  // Filter by class, then sort by class and roll number
  const classStudents = (
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

  // Search by student name and father's name. Capital or small letters don't matter,
  // and every word typed must be found (e.g. "ali ahmed" = student Ali, father Ahmed).
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  const visibleStudents =
    words.length === 0
      ? classStudents
      : classStudents.filter((s) => {
          const text = `${s.name || ""} ${s.guardian || ""}`.toLowerCase()
          return words.every((w) => text.includes(w))
        })

  const isFiltering = words.length > 0 || classFilter !== "All"

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Students</h1>
        <div className="flex flex-wrap items-center gap-3">
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

      {/* Search box */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student"
                        className="w-full border rounded-lg pl-10 pr-10 py-1.5 text-sm bg-white focus:outline-none focus:border-cyan-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Showing {visibleStudents.length} of {students.length} students
        </p>
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
                  {isFiltering ? "No students match your search." : "No students yet."}
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