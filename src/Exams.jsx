import { getBaseClassName } from "./Classes"

const EXAMS_URL = "http://localhost:5000/api/exams"
const SUBJECTS_URL = "http://localhost:5000/api/subjects"
const MARKS_URL = "http://localhost:5000/api/marks"
const SETTINGS_URL = "http://localhost:5000/api/settings"

// ---------- Exams ----------
export async function getExams() {
  const res = await fetch(EXAMS_URL)
  return res.json()
}
export async function addExam(name) {
  const res = await fetch(EXAMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  return res.json()
}
export async function removeExam(id) {
  const res = await fetch(`${EXAMS_URL}/${id}`, { method: "DELETE" })
  return res.json()
}

// ---------- Subjects (per BASE grade — same across all sections) ----------
export async function getSubjectsForClass(className) {
  const res = await fetch(`${SUBJECTS_URL}?className=${encodeURIComponent(className)}`)
  return res.json()
}
export async function addSubject(className, name, maxMarks) {
  const res = await fetch(SUBJECTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ className, name, maxMarks: Number(maxMarks) }),
  })
  return res.json()
}
export async function updateSubject(className, subjectId, updates) {
  const res = await fetch(`${SUBJECTS_URL}/${subjectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  return res.json()
}
export async function removeSubject(className, subjectId) {
  const res = await fetch(`${SUBJECTS_URL}/${subjectId}`, { method: "DELETE" })
  return res.json()
}

// ---------- Pass percentage (global setting) ----------
export async function getPassPercentage() {
  const res = await fetch(SETTINGS_URL)
  const data = await res.json()
  return data.passPercentage
}
export async function setPassPercentage(value) {
  const res = await fetch(SETTINGS_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passPercentage: Number(value) }),
  })
  return res.json()
}

// ---------- Marks entry ----------
export async function getMark(examId, studentId, subjectId) {
  const res = await fetch(`${MARKS_URL}?examId=${examId}&studentId=${studentId}&subjectId=${subjectId}`)
  const records = await res.json()
  return records.length > 0 && records[0].obtained !== null ? records[0].obtained : ""
}
export async function setMark(examId, studentId, subjectId, obtained) {
  const res = await fetch(MARKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examId, studentId, subjectId, obtained }),
  })
  return res.json()
}

// ---------- Result calculation ----------
export async function getStudentResult(examId, studentId, className) {
  const baseClass = getBaseClassName(className)
  const subjects = await getSubjectsForClass(baseClass)
  const marksRes = await fetch(`${MARKS_URL}?examId=${examId}&studentId=${studentId}`)
  const marksRecords = await marksRes.json()
  const passPercentage = await getPassPercentage()

  const rows = subjects.map((sub) => {
    const record = marksRecords.find((m) => m.subjectId === sub._id)
    const obtained = record && record.obtained !== null ? record.obtained : 0
    return { subjectId: sub._id, subject: sub.name, obtained, max: sub.maxMarks }
  })

  const totalObtained = rows.reduce((sum, r) => sum + r.obtained, 0)
  const totalMax = rows.reduce((sum, r) => sum + r.max, 0)
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  const status = percentage >= passPercentage ? "pass" : "fail"

  return { rows, totalObtained, totalMax, percentage, status }
}

// Ranks every student in a class-section for a given exam, sorted by percentage.
export async function getClassRanking(examId, className, studentsInClass) {
  const results = await Promise.all(
    studentsInClass.map(async (s) => ({
      student: s,
      result: await getStudentResult(examId, s._id, className),
    }))
  )
  results.sort((a, b) => b.result.percentage - a.result.percentage)
  return results.map((r, index) => ({ ...r, position: index + 1 }))
}
export async function getPublishedResults(examId) {
  const res = await fetch(`http://localhost:5000/api/result-publish?examId=${examId}`)
  return res.json()
}

export async function publishResult(examId, className) {
  await fetch("http://localhost:5000/api/result-publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examId, className }),
  })
}

export async function unpublishResult(examId, className) {
  await fetch(
    `http://localhost:5000/api/result-publish?examId=${examId}&className=${encodeURIComponent(className)}`,
    { method: "DELETE" }
  )
}