import { useState, useEffect } from "react"
import { getStudentsByClass } from "./Students"
import { getClassList } from "./Classes"
import { getTodayDate, getAttendanceForClassAndDate, saveAttendance } from "./Attendance"

function AttendanceMarking() {
  const classOptions = getClassList()
  const [selectedClass, setSelectedClass] = useState(classOptions[0])
  const [date, setDate] = useState(getTodayDate())
  const [students, setStudents] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadData() {
      const fetched = await getStudentsByClass(selectedClass)
      const classStudents = fetched
        .slice()
        .sort((a, b) => (parseInt(a.rollNo, 10) || 0) - (parseInt(b.rollNo, 10) || 0))
      setStudents(classStudents)
      const map = await getAttendanceForClassAndDate(selectedClass, date, classStudents)
      setStatusMap(map)
      setSaved(false)
    }
    loadData()
  }, [selectedClass, date])

  function setStatus(studentId, status) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  function markAllPresent() {
    const allPresent = {}
    students.forEach((s) => { allPresent[s._id] = "present" })
    setStatusMap(allPresent)
    setSaved(false)
  }

  async function handleSave() {
    await saveAttendance(date, statusMap)
    setSaved(true)
  }

  const presentCount = Object.values(statusMap).filter((s) => s === "present").length

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Mark Attendance</h1>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {classOptions.map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <button
          onClick={markAllPresent}
          className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
        >
          Mark All Present
        </button>

        <span className="text-sm text-gray-500 ml-auto">
          {presentCount} / {students.length} present
        </span>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {students.map((s) => {
          const isPresent = statusMap[s._id] === "present"
          return (
            <div key={s._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-gray-500">
                  Father: {s.guardian || "—"} &middot; Roll No: {s.rollNo}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(s._id, "present")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    isPresent ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatus(s._id, "absent")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    !isPresent ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          )
        })}
        {students.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">No students in this class.</p>
        )}
      </div>

      {students.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
          >
            Save Attendance
          </button>
          {saved && <span className="text-green-600 text-sm">Attendance saved!</span>}
        </div>
      )}
    </div>
  )
}

export default AttendanceMarking