import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail } from "./Teachers"
import { getStudentsByClass } from "./Students"
import { getBaseClassName } from "./Classes"
import { getExams, getSubjectsForClass, setMark } from "./Exams"

function TeacherMarksEntry() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState("")
  const [exams, setExams] = useState([])
  const [examId, setExamId] = useState("")
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [marks, setMarks] = useState({}) // key: studentId_subjectId -> value

  // 1. Class teacher's section + the school's exams
  useEffect(() => {
    async function load() {
      const t = await getTeacherByLoginEmail(user?.email)
      const examList = await getExams()
      setSection(t?.classTeacherOf || "")
      setExams(examList)
      if (examList.length > 0) setExamId(examList[0]._id)
      setLoading(false)
    }
    load()
  }, [user?.email])

  // 2. Students and the grade's subjects
  useEffect(() => {
    async function load() {
      if (!section) return
      setStudents(await getStudentsByClass(section))
      setSubjects(await getSubjectsForClass(getBaseClassName(section)))
    }
    load()
  }, [section])

  // 3. All marks of the selected exam (one request)
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

  function handleMarkChange(studentId, subjectId, value) {
    setMarks((prev) => ({ ...prev, [`${studentId}_${subjectId}`]: value }))
  }

  // Save to the database only when the teacher leaves the box
  async function handleMarkSave(studentId, subjectId) {
    const value = marks[`${studentId}_${subjectId}`]
    await setMark(examId, studentId, subjectId, value === "" || value === undefined ? null : Number(value))
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  if (!section) {
    return (
      <p className="text-gray-500">
        Only class teachers enter marks. Ask the admin to assign you as a class teacher.
      </p>
    )
  }

  if (exams.length === 0) {
    return (
      <p className="text-gray-500">
        No exams have been created yet. Add one under "Exams" first.
      </p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Enter Marks — Class {section}</h1>
      <p className="text-gray-500 mb-4">Enter marks for all subjects of your class.</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="border rounded px-3 py-2">
          {exams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      </div>

      {subjects.length === 0 ? (
        <p className="text-gray-500">
          No subjects set for Class {getBaseClassName(section)} yet — add some under "Subjects" first.
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
                        value={marks[`${s._id}_${sub._id}`] ?? ""}
                        onChange={(e) => handleMarkChange(s._id, sub._id, e.target.value)}
                        onBlur={() => handleMarkSave(s._id, sub._id)}
                        className="w-20 p-1.5 border rounded"
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