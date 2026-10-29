import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail } from "./Teachers"
import {
  getDays,
  getPeriods,
  getEntriesForTeacher,
  getSubstitutionsForTeacher,
} from "./Timetable"

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

function TeacherClasses() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState(null)
  const [periods, setPeriods] = useState([])
  const [allEntries, setAllEntries] = useState([])
  const [todaySubs, setTodaySubs] = useState([])

  const days = getDays()

  useEffect(() => {
    async function load() {
      const t = await getTeacherByLoginEmail(user?.email)
      setTeacher(t || null)

      if (t) {
        const [periodList, entries, subs] = await Promise.all([
          getPeriods(),
          getEntriesForTeacher(t._id),
          getSubstitutionsForTeacher(getTodayDate(), t._id),
        ])
        setPeriods(periodList)
        setAllEntries(entries)
        setTodaySubs(subs)
      }
      setLoading(false)
    }
    load()
  }, [user?.email])

  function periodLabel(periodId) {
    return periods.find((p) => p._id === periodId)?.label || "Unknown Period"
  }

  function periodIndex(periodId) {
    const i = periods.findIndex((p) => p._id === periodId)
    return i === -1 ? 999 : i
  }

  // This teacher's periods on one day, in period order
  function entriesForDay(day) {
    return allEntries
      .filter((e) => e.day === day)
      .sort((a, b) => periodIndex(a.periodId) - periodIndex(b.periodId))
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  if (!teacher) {
    return <p className="text-gray-500">Your login isn't linked to a teacher record yet.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">My Classes</h1>
      {teacher.classTeacherOf && (
        <p className="text-sm text-cyan-700 mb-4">
          You are the class teacher of Class {teacher.classTeacherOf}
        </p>
      )}

      {/* Substitution periods for today */}
      {todaySubs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-2">
            Covering today (substitution)
          </h2>
          <ul className="space-y-1 text-sm text-yellow-900">
            {todaySubs.map((s) => (
              <li key={s._id}>
                {periodLabel(s.periodId)} — Class {s.className}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allEntries.length === 0 ? (
        <p className="text-gray-500">
          You are not assigned to any periods yet. Ask the admin to set up your timetable.
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const dayEntries = entriesForDay(day)
            return (
              <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">{day}</div>
                {dayEntries.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No periods.</p>
                ) : (
                  <table className="w-full text-left">
                    <tbody>
                      {dayEntries.map((e) => (
                        <tr key={e._id} className="border-t">
                          <td className="px-4 py-2 w-1/3">{periodLabel(e.periodId)}</td>
                          <td className="px-4 py-2 w-1/3">Class {e.className}</td>
                          <td className="px-4 py-2 w-1/3 text-gray-600">{e.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TeacherClasses