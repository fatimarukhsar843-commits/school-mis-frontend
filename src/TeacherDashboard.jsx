import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail, getTeachers } from "./Teachers"
import { getTodayDate } from "./Attendance"
import {
  getDayName,
  getPeriods,
  getEntriesForTeacherOnDay,
  getEntriesForTeacher,
  getSubstitutionsForTeacher,
  getEntriesForDayAndClass,
} from "./Timetable"

function TeacherDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState(null)
  const [periods, setPeriods] = useState([])
  const [todaysEntries, setTodaysEntries] = useState([])
  const [substitutionsToday, setSubstitutionsToday] = useState([])
  const [distinctClassCount, setDistinctClassCount] = useState(0)

  const today = getTodayDate()
  const todayDayName = getDayName(today)

  useEffect(() => {
    async function load() {
      const t = await getTeacherByLoginEmail(user?.email)
      if (!t) {
        setTeacher(null)
        setLoading(false)
        return
      }

      const [periodsData, todays, subs, allEntries, allTeachers] = await Promise.all([
        getPeriods(),
        getEntriesForTeacherOnDay(t._id, todayDayName),
        getSubstitutionsForTeacher(today, t._id),
        getEntriesForTeacher(t._id),
        getTeachers(),
      ])

      // Keep today's classes in the order the periods were defined
      todays.sort(
        (a, b) =>
          periodsData.findIndex((p) => p._id === a.periodId) -
          periodsData.findIndex((p) => p._id === b.periodId)
      )

      // For each substitution, find the normal timetable entry (to show whose class it was)
      const subsWithDetails = await Promise.all(
        subs.map(async (sub) => {
          const dayEntries = await getEntriesForDayAndClass(todayDayName, sub.className)
          const normalEntry = dayEntries.find((e) => e.periodId === sub.periodId)
          const originalTeacher = normalEntry
            ? allTeachers.find((x) => x._id === normalEntry.teacherId)
            : null
          return { ...sub, normalEntry, originalTeacher }
        })
      )

      setTeacher(t)
      setPeriods(periodsData)
      setTodaysEntries(todays)
      setSubstitutionsToday(subsWithDetails)
      setDistinctClassCount(new Set(allEntries.map((e) => e.className)).size)
      setLoading(false)
    }
    load()
  }, [user])

  function periodLabel(periodId) {
    return periods.find((p) => p._id === periodId)?.label || "Unknown Period"
  }

  if (loading) {
    return <p className="text-gray-400">Loading...</p>
  }

  if (!teacher) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-gray-500">
          Your login isn't linked to a teacher record yet. Ask the admin to
          set your "Login Email" on the Teachers page so your schedule shows up here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Welcome, {teacher.name}!</h1>
      <p className="text-gray-500 mb-4">{today} &middot; {todayDayName}</p>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <p className="text-sm text-cyan-700">Classes You Teach</p>
          <p className="text-2xl font-bold text-cyan-700">{distinctClassCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Periods Today</p>
          <p className="text-2xl font-bold text-blue-700">{todaysEntries.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Covering Today</p>
          <p className="text-2xl font-bold text-yellow-700">{substitutionsToday.length}</p>
        </div>
      </div>

      {/* Today's own schedule */}
      <h2 className="text-lg font-semibold mb-2">Today's Classes</h2>
      <div className="bg-white rounded-lg shadow divide-y mb-6">
        {todaysEntries.map((entry) => (
          <div key={entry._id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{periodLabel(entry.periodId)}</p>
              <p className="text-sm text-gray-500">
                Class {entry.className} &middot; {entry.subject}
              </p>
            </div>
          </div>
        ))}
        {todaysEntries.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400">
            No classes scheduled for you today ({todayDayName}).
          </p>
        )}
      </div>

      {/* Substitution assignments */}
      {substitutionsToday.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2">
            You're Covering For Another Teacher Today
          </h2>
          <div className="bg-white rounded-lg shadow divide-y">
            {substitutionsToday.map((sub) => (
              <div key={sub._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{periodLabel(sub.periodId)}</p>
                  <p className="text-sm text-gray-500">
                    Class {sub.className}
                    {sub.normalEntry && <> &middot; {sub.normalEntry.subject}</>}
                    {sub.originalTeacher && <> &middot; covering for {sub.originalTeacher.name}</>}
                  </p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  Substitute
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default TeacherDashboard