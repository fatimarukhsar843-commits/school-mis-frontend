import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getStudentsByParentEmail } from "./Students"
import { getStudentAttendanceHistory } from "./Attendance"

function ParentAttendance() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [history, setHistory] = useState([])

  // Load this parent's children once
  useEffect(() => {
    if (user?.email) {
      getStudentsByParentEmail(user.email).then((data) => {
        setChildren(data)
        if (data.length > 0) setSelectedChildId(data[0]._id)
      })
    }
  }, [user])

  // Load attendance history whenever the selected child changes
  useEffect(() => {
    async function loadHistory() {
      if (selectedChildId) {
        const data = await getStudentAttendanceHistory(selectedChildId)
        setHistory(data.sort((a, b) => b.date.localeCompare(a.date)))
      }
    }
    loadHistory()
  }, [selectedChildId])

  const presentCount = history.filter((h) => h.status === "present").length
  const absentCount = history.filter((h) => h.status === "absent").length

  if (children.length === 0) {
    return <p className="text-gray-500">No student records linked to this account.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Attendance</h1>

      {children.length > 1 && (
        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="border rounded px-3 py-2 mb-4"
        >
          {children.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Days Present</p>
          <p className="text-3xl font-semibold text-green-700">{presentCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Days Absent</p>
          <p className="text-3xl font-semibold text-red-700">{absentCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow divide-y max-w-md">
        {history.map((h) => (
          <div key={h._id} className="flex items-center justify-between px-4 py-3">
            <span>{h.date}</span>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                h.status === "present"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {h.status === "present" ? "Present" : "Absent"}
            </span>
          </div>
        ))}
        {history.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">
            No attendance records yet.
          </p>
        )}
      </div>
    </div>
  )
}

export default ParentAttendance