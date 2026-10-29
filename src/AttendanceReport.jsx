import { useState, useEffect } from "react"
import { getStudents } from "./Students"
import { getTodayDate, getDailySummaryByClass, getAbsentStudentsForDate } from "./Attendance"

function AttendanceReport() {
  const [date, setDate] = useState(getTodayDate())
  const [summary, setSummary] = useState([])
  const [absentStudents, setAbsentStudents] = useState([])

  useEffect(() => {
    async function loadData() {
      const allStudents = await getStudents()
      const summaryData = await getDailySummaryByClass(date, allStudents)
      const absentData = await getAbsentStudentsForDate(date, allStudents)
      setSummary(summaryData)
      setAbsentStudents(absentData)
    }
    loadData()
  }, [date])

  function buildMessage(student) {
    return `Dear ${student.guardian}, this is to inform you that your child ${student.name} (Class ${student.className}, Roll No ${student.rollNo}) was ABSENT from school today (${date}). Please contact the school office if you have any concerns.`
  }

  function buildSmsLink(student) {
    const message = encodeURIComponent(buildMessage(student))
    return `sms:${student.phone}?body=${message}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Attendance Report</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <h2 className="text-lg font-semibold mb-2">Attendance by Class</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Total Students</th>
              <th className="px-4 py-3">Present</th>
              <th className="px-4 py-3">Absent</th>
              <th className="px-4 py-3">Not Marked</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.className} className="border-t">
                <td className="px-4 py-3">Class {row.className}</td>
                <td className="px-4 py-3">{row.total}</td>
                <td className="px-4 py-3 text-green-700">{row.present}</td>
                <td className="px-4 py-3 text-red-600">{row.absent}</td>
                <td className="px-4 py-3 text-gray-400">{row.notMarked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          Absent Students Today ({absentStudents.length})
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {absentStudents.map((s) => (
          <div key={s._id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-gray-500">
                Class {s.className} &middot; Guardian: {s.guardian} &middot; {s.phone}
              </p>
            </div>
            <a
              href={buildSmsLink(s)}
              className="px-3 py-1.5 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700 inline-block"
            >
              Message Parent
            </a>
          </div>
        ))}

        {absentStudents.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">
            No absent students recorded for this date.
          </p>
        )}
      </div>
    </div>
  )
}

export default AttendanceReport