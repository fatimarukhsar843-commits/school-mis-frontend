import { useState, useEffect, useRef } from "react"
import {
  getDays,
  getPeriods,
  addPeriod,
  updatePeriodLabel,
  removePeriod,
  getEntriesForDayAndClass,
  setEntry,
} from "./Timetable"
import { getClassList } from "./Classes"
import { getTeachers } from "./Teachers"

function TimetableManage() {
  const classOptions = getClassList()
  const [periods, setPeriods] = useState([])
  const [teachers, setTeachers] = useState([])
  const [entries, setEntries] = useState([])
  const [newPeriodLabel, setNewPeriodLabel] = useState("")
  const [day, setDay] = useState(getDays()[0])
  const [className, setClassName] = useState(classOptions[0] || "")
  const [saveState, setSaveState] = useState({}) // periodId -> "saving" | "saved" | "error"

  // Always-current copies, so delayed saves use the latest values
  const entriesRef = useRef([])
  entriesRef.current = entries
  const viewRef = useRef({ day, className })
  viewRef.current = { day, className }
  const timers = useRef({})

  async function refreshPeriods() {
    setPeriods(await getPeriods())
  }

  async function refreshEntries() {
    // Never ask for entries without a class (the server would return every class)
    if (!className) {
      setEntries([])
      return
    }
    setEntries(await getEntriesForDayAndClass(day, className))
  }

  useEffect(() => {
    refreshPeriods()
    getTeachers().then(setTeachers)
  }, [])

  useEffect(() => {
    setSaveState({})
    refreshEntries()
  }, [day, className])

  function findEntry(periodId) {
    return entries.find((e) => e.periodId === periodId)
  }

  function latestEntry(periodId) {
    return entriesRef.current.find((e) => e.periodId === periodId)
  }

  // Saves one row. d and c are the day and class the row belonged to when the save started.
  async function saveEntry(d, c, periodId, teacherId, subject) {
    setSaveState((s) => ({ ...s, [periodId]: "saving" }))
    try {
      const saved = await setEntry(d, c, periodId, teacherId || "", subject || "")
      setSaveState((s) => ({ ...s, [periodId]: "saved" }))
      return saved
    } catch (err) {
      setSaveState((s) => ({ ...s, [periodId]: "error" }))
      alert("Could not save: " + err.message)
      return null
    }
  }

  async function handleAddPeriod() {
    if (!newPeriodLabel.trim()) return
    await addPeriod(newPeriodLabel.trim())
    setNewPeriodLabel("")
    refreshPeriods()
  }

  async function handleRemovePeriod(id) {
    if (confirm("Remove this period? Any class assignments using it will also be cleared.")) {
      await removePeriod(id)
      refreshPeriods()
      refreshEntries()
    }
  }

  // Typing updates the screen immediately; saving happens when you click away
  function handlePeriodLabelChange(id, label) {
    setPeriods((prev) => prev.map((p) => (p._id === id ? { ...p, label } : p)))
  }

  async function handlePeriodLabelBlur(id) {
    const p = periods.find((p) => p._id === id)
    if (p) await updatePeriodLabel(id, p.label)
  }

  async function handleTeacherChange(periodId, teacherId) {
    if (!className) return
    clearTimeout(timers.current[periodId])
    const d = day
    const c = className
    const subject = latestEntry(periodId)?.subject || ""

    // Show the choice straight away
    setEntries((prev) => {
      const exists = prev.some((e) => e.periodId === periodId)
      if (exists) {
        return prev.map((e) => (e.periodId === periodId ? { ...e, teacherId: teacherId || null } : e))
      }
      return [...prev, { periodId, day: d, className: c, teacherId: teacherId || null, subject }]
    })

    const saved = await saveEntry(d, c, periodId, teacherId, subject)
    if (!saved) {
      refreshEntries() // go back to what is really saved
      return
    }
    // Keep whatever subject the user may have typed in the meantime
    if (viewRef.current.day === d && viewRef.current.className === c) {
      setEntries((prev) =>
        prev.map((e) => (e.periodId === periodId ? { ...saved, subject: e.subject } : e))
      )
    }
  }

  function handleSubjectChange(periodId, subject) {
    if (!className) return
    const d = day
    const c = className

    setEntries((prev) => {
      const exists = prev.find((e) => e.periodId === periodId)
      if (exists) {
        return prev.map((e) => (e.periodId === periodId ? { ...e, subject } : e))
      }
      return [...prev, { periodId, day: d, className: c, teacherId: null, subject }]
    })
    setSaveState((s) => ({ ...s, [periodId]: undefined }))

    // Save by itself about a second after typing stops
    clearTimeout(timers.current[periodId])
    timers.current[periodId] = setTimeout(() => {
      const teacherId = latestEntry(periodId)?.teacherId || ""
      saveEntry(d, c, periodId, teacherId, subject)
    }, 800)
  }

  function handleSubjectBlur(periodId) {
    if (!className) return
    clearTimeout(timers.current[periodId])
    const entry = latestEntry(periodId)
    if (!entry) return
    saveEntry(day, className, periodId, entry.teacherId || "", entry.subject || "")
  }

  if (classOptions.length === 0) {
    return (
      <p className="text-gray-500">
        No classes found. Add classes under "Classes & Sections" first.
      </p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Class Timetable</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Periods</h2>
        <p className="text-sm text-gray-500 mb-3">
          Add as many periods as you need, and label them however you like
          (e.g. "Period 1", "9:00 - 9:40").
        </p>

        <div className="space-y-2 mb-3">
          {periods.map((p) => (
            <div key={p._id} className="flex items-center gap-2">
              <input
                type="text"
                value={p.label}
                onChange={(e) => handlePeriodLabelChange(p._id, e.target.value)}
                onBlur={() => handlePeriodLabelBlur(p._id)}
                className="border rounded px-3 py-1.5 flex-1"
              />
              <button
                onClick={() => handleRemovePeriod(p._id)}
                className="text-red-500 hover:underline text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          {periods.length === 0 && (
            <p className="text-sm text-gray-400">No periods added yet — add your first one below.</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Period 1 or 9:00 - 9:40"
            value={newPeriodLabel}
            onChange={(e) => setNewPeriodLabel(e.target.value)}
            className="border rounded px-3 py-1.5 flex-1"
          />
          <button
            onClick={handleAddPeriod}
            className="px-4 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm"
          >
            + Add Period
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {getDays().map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {classOptions.map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Subject</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => {
              const entry = findEntry(p._id)
              const state = saveState[p._id]
              return (
                <tr key={p._id} className="border-t">
                  <td className="px-4 py-3">{p.label}</td>
                  <td className="px-4 py-3">
                    <select
                      value={entry?.teacherId || ""}
                      onChange={(e) => handleTeacherChange(p._id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">-- Not Assigned --</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Math"
                        value={entry?.subject || ""}
                        onChange={(e) => handleSubjectChange(p._id, e.target.value)}
                        onBlur={() => handleSubjectBlur(p._id)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur() }}
                        className="border rounded px-2 py-1 w-full"
                      />
                      <span className="text-xs w-16 shrink-0">
                        {state === "saving" && <span className="text-gray-400">Saving…</span>}
                        {state === "saved" && <span className="text-green-600">Saved ✓</span>}
                        {state === "error" && <span className="text-red-500">Failed</span>}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {periods.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Add a period above to start building the timetable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TimetableManage