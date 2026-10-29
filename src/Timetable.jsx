const PERIODS_URL = "http://localhost:5000/api/periods"
const TIMETABLE_URL = "http://localhost:5000/api/timetable"
const SUBS_URL = "http://localhost:5000/api/substitutions"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function getDays() {
  return days
}

// ---------- Periods ----------
export async function getPeriods() {
  const res = await fetch(PERIODS_URL)
  return res.json()
}

export async function addPeriod(label) {
  const res = await fetch(PERIODS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  })
  return res.json()
}

export async function updatePeriodLabel(id, label) {
  const res = await fetch(`${PERIODS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  })
  return res.json()
}

export async function removePeriod(id) {
  const res = await fetch(`${PERIODS_URL}/${id}`, { method: "DELETE" })
  return res.json()
}

// ---------- Weekly timetable entries ----------
// All entries for one day + class (the admin grid fetches this once, then looks up locally)
export async function getEntriesForDayAndClass(day, className) {
  const res = await fetch(
    `${TIMETABLE_URL}?day=${encodeURIComponent(day)}&className=${encodeURIComponent(className)}`
  )
  return res.json()
}

// Throws an error if the server refuses to save, so the page can show the reason
export async function setEntry(day, className, periodId, teacherId, subject) {
  const res = await fetch(`${TIMETABLE_URL}/set-entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day, className, periodId, teacherId, subject }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || "Could not save")
  return data
}

// Kept so older pages that still import it don't break the app.
// (Prefer getEntriesForDayAndClass and a local lookup for new code.)
export async function getEntry(day, className, periodId) {
  const entries = await getEntriesForDayAndClass(day, className)
  return entries.find((e) => e.periodId === periodId)
}

// Every period a teacher teaches on a given day — used for substitution
export async function getEntriesForTeacherOnDay(teacherId, day) {
  const res = await fetch(
    `${TIMETABLE_URL}?teacherId=${teacherId}&day=${encodeURIComponent(day)}`
  )
  return res.json()
}

// Every period a teacher teaches, across all days
export async function getEntriesForTeacher(teacherId) {
  const res = await fetch(`${TIMETABLE_URL}?teacherId=${teacherId}`)
  return res.json()
}

// ---------- Substitutions (temporary, date-specific) ----------
export async function getSubstitutionsForTeacher(date, teacherId) {
  const res = await fetch(`${SUBS_URL}?date=${date}&substituteTeacherId=${teacherId}`)
  return res.json()
}

export async function getSubstitution(date, className, periodId) {
  const res = await fetch(
    `${SUBS_URL}?date=${date}&className=${encodeURIComponent(className)}&periodId=${periodId}`
  )
  const results = await res.json()
  return results[0]
}

// All substitutions on one date (lets a page fetch once and look up locally)
export async function getSubstitutionsForDate(date) {
  const res = await fetch(`${SUBS_URL}?date=${date}`)
  return res.json()
}

export async function setSubstitution(date, day, className, periodId, substituteTeacherId) {
  const res = await fetch(SUBS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, day, className, periodId, substituteTeacherId }),
  })
  return res.json()
}

export async function removeSubstitution(date, className, periodId) {
  const res = await fetch(
    `${SUBS_URL}?date=${date}&className=${encodeURIComponent(className)}&periodId=${periodId}`,
    { method: "DELETE" }
  )
  return res.json()
}

// Converts a date string (YYYY-MM-DD) into its weekday name, e.g. "Monday"
export function getDayName(dateStr) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const d = new Date(dateStr + "T00:00:00")
  return dayNames[d.getDay()]
}