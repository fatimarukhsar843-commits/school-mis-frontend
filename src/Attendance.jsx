const API_URL = "http://localhost:5000/api/attendance"

export function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

// Get attendance for a specific class + date (returns a map of studentId -> status)
export async function getAttendanceForClassAndDate(className, date, studentsInClass) {
  const res = await fetch(`${API_URL}?date=${date}`)
  const records = await res.json()

  const map = {}
  studentsInClass.forEach((s) => {
    const record = records.find((r) => r.studentId === s._id)
    map[s._id] = record ? record.status : "present"
  })
  return map
}

// Save attendance for a whole class on a given date
// statusMap looks like: { studentId1: "present", studentId2: "absent", ... }
export async function saveAttendance(date, statusMap) {
  const records = Object.entries(statusMap).map(([studentId, status]) => ({
    studentId,
    status,
  }))

  const res = await fetch(`${API_URL}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, records }),
  })
  return res.json()
}

// Get a student's attendance history (used later for parent portal / reports)
export async function getStudentAttendanceHistory(studentId) {
  const res = await fetch(`${API_URL}/student/${studentId}`)
  return res.json()
}

// Get a summary (present/absent counts) for a given date, broken down by class.
export async function getDailySummaryByClass(date, allStudents) {
  const res = await fetch(`${API_URL}?date=${date}`)
  const records = await res.json()

  const classNames = [...new Set(allStudents.map((s) => s.className))]

  return classNames.map((className) => {
    const studentsInClass = allStudents.filter((s) => s.className === className)
    let present = 0
    let absent = 0

    studentsInClass.forEach((s) => {
      const record = records.find((r) => r.studentId === s._id)
      if (record) {
        if (record.status === "present") present++
        else absent++
      }
    })

    return {
      className,
      total: studentsInClass.length,
      present,
      absent,
      notMarked: studentsInClass.length - present - absent,
    }
  })
}

// Get the full list of absent students for a date, with their student info attached.
export async function getAbsentStudentsForDate(date, allStudents) {
  const res = await fetch(`${API_URL}?date=${date}`)
  const records = await res.json()

  const absentRecords = records.filter((r) => r.status === "absent")
  return absentRecords
    .map((r) => allStudents.find((s) => s._id === r.studentId))
    .filter(Boolean)
}