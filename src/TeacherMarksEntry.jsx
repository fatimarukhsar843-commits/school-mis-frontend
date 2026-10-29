import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail } from "./Teachers"
import { getStudentsByClass } from "./Students"
import { getBaseClassName } from "./Classes"
import { getEntriesForTeacher } from "./Timetable"
import { getExams, getSubjectsForClass, setMark, getPublishedResults } from "./Exams"

function norm(text) {
  return (text || "").trim().toLowerCase()
}

function TeacherMarksEntry() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState(null)
  const [exams, setExams] = useState([])
  const [examId, setExamId] = useState("")

  // access[className] = { all: true/false, names: ["maths", "urdu"] }
  const [access, setAccess] = useState({})
  const [className, setClassName] = useState("")

  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([]) // subjects this teacher may enter
  const [timetableNames, setTimetableNames] = useState([])
  const [marks, setMarks] = useState({}) // studentId_subjectId -> value
  const [published, setPublished] = useState(false)

  const classNames = Object.keys(access)

  // 1. Teacher, exams, and which classes/subjects this teacher may enter
  useEffect(() => {
    async function load() {
      const t = await getTeacherByLoginEmail(user?.email)
      const examList = await getExams()
      setTeacher(t || null)
      setExams(examList)
      if (examList.length > 0) setExamId(examList[0]._id)

      const acc = {}
      if (t) {
        const entries = await getEntriesForTeacher(t._id)
        entries.forEach((e) => {
          if (!acc[e.className]) acc[e.className] = { all: false, names: [] }
          acc[e.className].names.push(norm(e.subject))
        })
        // A class teacher may enter every subject of their own class
        if (t.classTeacherOf) {
          if (!acc[t.classTeacherOf]) acc[t.classTeacherOf] = { all: true, names: [] }
          acc[t.classTeacherOf].all = true
        }
      }
      setAccess(acc)
      const first = Object.keys(acc)[0]
      if (first) setClassName(first)
      setLoading(false)
    }
    load()
  }, [user?.email])

  // 2. Students and the subjects this teacher may enter, for the chosen class
  useEffect(() => {
    async function load() {
      if (!className) return
      const allSubjects = await getSubjectsForClass(getBaseClassName(className))
      const rule = access[className]
      const editable = rule.all
        ? allSubjects
        : allSubjects.filter((s) => rule.names.includes(norm(s.name)))
      setStudents(await getStudentsByClass(className))
      setSubjects(editable)
      setTimetableNames([...new Set(rule.names)])
    }
    load()
  }, [className, access])

  // 3. All marks for the exam (one request)
  useEffect(() => {
    async function load() {
      if (!examId) return
      const res = await fetch(`http://localhost:5000/api/marks?examId=${examId}`)
      const list = await res.json()
      const map = {}
      list.forEach((m) => {
        map[`${m.studentId}_${m.subjectId}`] =
          m.obtained === null || m.obtained === undefined ? "" : m.obtained
      })
      setMarks(map)
    }
    load()
  }, [examId])

  // 4. Is this class's result already published? (then marks are locked)
  useEffect(() => {
    async function load() {
      if (!examId || !className) return
      const pubs = await getPublishedResults(examId)
      setPublished(pubs.some((p) => p.className === className))
    }
    load()
  }, [examId, className])

  function handleMarkChange(studentId, subjectId, value) {
    setMarks((prev) => ({ ...prev, [`${studentId}_${subjectId}`]: value }))
  }

  // Save to the database only when the teacher leaves the box
  async function handleMarkSave(studentId, subjectId) {
    const value = marks[`${studentId}_${subjectId}`]
    await setMark(examId, studentId, subjectId, value === "" || value === undefined ? null : Number(value))
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  if (!teacher) {
    return <p className="text-gray-500">Your login isn't linked to a teacher record yet.</p>
  }

  if (classNames.length === 0) {
    return (
      <p className="text-gray-500">
        You are not assigned to any classes yet. Ask the admin to assign you in the Timetable.
      </p>
    )
  }

  if (exams.length === 0) {
    return (
      <p className="text-gray-500">
        No exams have been created yet. A class teacher can add one under "Exams".
      </p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Enter Marks</h1>
      <p className="text-gray-500 mb-4">
        Enter marks for the subjects you teach. The class teacher sees them all together.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="border rounded px-3 py-2">
          {exams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
        <select value={className} onChange={(e) => setClassName(e.target.value)} className="border rounded px-3 py-2">
          {classNames.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      {published && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 mb-4 text-sm">
          This class's result has already been published, so marks are locked.
          Ask the class teacher to unpublish it if you need to change something.
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-gray-500">
          None of your subjects for Class {className} match the subject list.
          {timetableNames.length > 0 && (
            <> Your Timetable subject is "{timetableNames.join('", "')}". </>
          )}
          Ask the class teacher to add a subject with the same name under "Subjects".
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-gray-100">Student</th>
                {subjects.map((sub) => (
                  <th key={sub._id} className="px-4 py-3 whitespace-nowrap">
                    {sub.name} <span className="text-gray-400">/{sub.maxMarks}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="px-4 py-3 sticky left-0 bg-white font-medium whitespace-nowrap">{s.name}</td>
                  {subjects.map((sub) => (
                    <td key={sub._id} className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={sub.maxMarks}
                        disabled={published}
                        value={marks[`${s._id}_${sub._id}`] ?? ""}
                        onChange={(e) => handleMarkChange(s._id, sub._id, e.target.value)}
                        onBlur={() => handleMarkSave(s._id, sub._id)}
                        className="w-20 p-1.5 border rounded disabled:bg-gray-100"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={subjects.length + 1} className="px-4 py-6 text-center text-gray-400">
                    No students in this class.
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

export default TeacherMarksEntry