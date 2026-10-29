import { useState, useEffect } from "react"
import {
  getDayName,
  getEntriesForTeacherOnDay,
  getPeriods,
  getSubstitutionsForDate,
  setSubstitution,
  removeSubstitution,
} from "./Timetable"
import { getTeachers } from "./Teachers"

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

function Substitution() {
  const [date, setDate] = useState(getTodayDate())
  const [absentTeacherId, setAbsentTeacherId] = useState("")
  const [teachers, setTeachers] = useState([])
  const [periods, setPeriods] = useState([])
  const [teacherEntries, setTeacherEntries] = useState([])
  const [subs, setSubs] = useState([])

  const day = getDayName(date)

  // Teachers and periods: load once
  useEffect(() => {
    async function load() {
      setTeachers(await getTeachers())
      setPeriods(await getPeriods())
    }
    load()
  }, [])

  // This teacher's normal periods on the chosen weekday
  useEffect(() => {
    async function load() {
      if (!absentTeacherId) {
        setTeacherEntries([])
        return
      }
      setTeacherEntries(await getEntriesForTeacherOnDay(absentTeacherId, day))
    }
    load()
  }, [absentTeacherId, day])

  // All substitutions on the chosen date (one request, looked up locally)
  async function loadSubs() {
    setSubs(await getSubstitutionsForDate(date))
  }
  useEffect(() => {
    loadSubs()
  }, [date])

  function periodLabel(periodId) {
    return periods.find((p) => p._id === periodId)?.label || "Unknown Period"
  }

  function findSub(className, periodId) {
    return subs.find((s) => s.className === className && s.periodId === periodId)
  }

  async function handleAssignSub(className, periodId, subTeacherId) {
    if (!subTeacherId) {
      await removeSubstitution(date, className, periodId)
    } else {
      await setSubstitution(date, day, className, periodId, subTeacherId)
    }
    loadSubs()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Teacher Substitution</h1>
      <p className="text-gray-500 mb-4">
        Temporarily reassign an absent teacher's periods for a single day.
        This does NOT change their permanent timetable.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <select
          value={absentTeacherId}
          onChange={(e) => setAbsentTeacherId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">-- Select Absent Teacher --</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">Day: {day}</span>
      </div>

      {absentTeacherId && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Substitute Teacher</th>
              </tr>
            </thead>
            <tbody>
              {teacherEntries.map((entry) => {
                const sub = findSub(entry.className, entry.periodId)
                return (
                  <tr key={entry._id} className="border-t">
                    <td className="px-4 py-3">{periodLabel(entry.periodId)}</td>
                    <td className="px-4 py-3">Class {entry.className}</td>
                    <td className="px-4 py-3">{entry.subject}</td>
                    <td className="px-4 py-3">
                      <select
                        value={sub?.substituteTeacherId || ""}
                        onChange={(e) =>
                          handleAssignSub(entry.className, entry.periodId, e.target.value)
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="">-- None --</option>
                        {teachers
                          .filter((t) => t._id !== absentTeacherId)
                          .map((t) => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
              {teacherEntries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    This teacher has no periods scheduled on {day}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Substitution