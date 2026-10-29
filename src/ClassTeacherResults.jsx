import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail } from "./Teachers"
import { getStudentsByClass } from "./Students"
import { getBaseClassName } from "./Classes"
import {
  getExams, getSubjectsForClass, getClassRanking,
  getPublishedResults, publishResult, unpublishResult,
} from "./Exams"
import ResultCard from "./ResultCard"

function ClassTeacherResults() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState("")
  const [exams, setExams] = useState([])
  const [examId, setExamId] = useState("")
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [marks, setMarks] = useState({}) // studentId_subjectId -> number (only entered marks)
  const [ranking, setRanking] = useState([])
  const [published, setPublished] = useState(false)
  const [viewingStudent, setViewingStudent] = useState(null)

  useEffect(() => {
    async function load() {
      const t = await getTeacherByLoginEmail(user?.email)
      const list = await getExams()
      setSection(t?.classTeacherOf || "")
      setExams(list)
      if (list.length > 0) setExamId(list[0]._id)
      setLoading(false)
    }
    load()
  }, [user?.email])

  async function loadResults() {
    if (!examId || !section) return
    const studentList = await getStudentsByClass(section)
    const subjectList = await getSubjectsForClass(getBaseClassName(section))
    setStudents(studentList)
    setSubjects(subjectList)

    // Which marks have actually been entered?
    const res = await fetch(`http://localhost:5000/api/marks?examId=${examId}`)
    const list = await res.json()
    const map = {}
    list.forEach((m) => {
      if (m.obtained !== null && m.obtained !== undefined) {
        map[`${m.studentId}_${m.subjectId}`] = m.obtained
      }
    })
    setMarks(map)

    setRanking(subjectList.length > 0 ? await getClassRanking(examId, section, studentList) : [])
    const pubs = await getPublishedResults(examId)
    setPublished(pubs.some((p) => p.className === section))
  }

  useEffect(() => {
    loadResults()
  }, [examId, section])

  // For each subject: how many students have a mark entered
  function subjectProgress(sub) {
    const done = students.filter((s) => marks[`${s._id}_${sub._id}`] !== undefined).length
    return { done, total: students.length }
  }

  const incompleteSubjects = subjects.filter((sub) => {
    const p = subjectProgress(sub)
    return p.done < p.total
  })

  async function handleTogglePublish() {
    if (published) {
      await unpublishResult(examId, section)
    } else {
      let message = "Submit this result to the admin? Marks will be locked."
      if (incompleteSubjects.length > 0) {
        message =
          `These subjects are NOT complete yet: ${incompleteSubjects.map((s) => s.name).join(", ")}.\n` +
          `Missing marks count as 0.\n\nSubmit anyway?`
      }
      if (!confirm(message)) return
      await publishResult(examId, section)
    }
    loadResults()
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  if (!section) {
    return <p className="text-gray-500">Only class teachers can view and publish class results.</p>
  }

  if (exams.length === 0) {
    return <p className="text-gray-500">No exams have been created yet.</p>
  }

  const selectedExam = exams.find((e) => e._id === examId)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Class Results — {section}</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {exams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {published ? "SUBMITTED TO ADMIN" : "NOT SUBMITTED"}
        </span>

        <button
          onClick={loadResults}
          className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
        >
          ↻ Refresh
        </button>

        <button
          onClick={handleTogglePublish}
          className={`px-4 py-2 rounded text-white ${
            published ? "bg-gray-500 hover:bg-gray-600" : "bg-cyan-600 hover:bg-cyan-700"
          }`}
        >
          {published ? "Unpublish" : "Submit Final Result to Admin"}
        </button>
      </div>

      {/* Progress of each subject */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {subjects.map((sub) => {
            const p = subjectProgress(sub)
            const complete = p.total > 0 && p.done === p.total
            return (
              <span
                key={sub._id}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  complete ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"
                }`}
              >
                {sub.name}: {p.done}/{p.total} {complete ? "✓" : "entered"}
              </span>
            )
          })}
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-gray-500">
          No subjects set for Class {getBaseClassName(section)} yet — add some under "Subjects" first.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Student</th>
                {subjects.map((sub) => (
                  <th key={sub._id} className="px-4 py-3 whitespace-nowrap">
                    {sub.name} <span className="text-gray-400">/{sub.maxMarks}</span>
                  </th>
                ))}
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ student, result, position }) => {
                const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null
                const isPass = result.status === "pass"
                return (
                  <tr key={student._id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {medal ? <span className="text-lg">{medal}</span> : position}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{student.name}</td>
                    {subjects.map((sub) => {
                      const value = marks[`${student._id}_${sub._id}`]
                      return (
                        <td key={sub._id} className="px-4 py-3">
                          {value !== undefined ? value : <span className="text-red-400">—</span>}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 whitespace-nowrap">{result.totalObtained} / {result.totalMax}</td>
                    <td className="px-4 py-3">{result.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isPass ? "PASS" : "FAIL"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewingStudent({ student, position })}
                        className="text-cyan-600 hover:underline text-sm whitespace-nowrap"
                      >
                        View Card
                      </button>
                    </td>
                  </tr>
                )
              })}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={subjects.length + 6} className="px-4 py-6 text-center text-gray-400">
                    No students in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewingStudent && (
        <ResultCard
          student={viewingStudent.student}
          position={viewingStudent.position}
          examId={examId}
          examName={selectedExam?.name}
          className={section}
          onClose={() => setViewingStudent(null)}
        />
      )}
    </div>
  )
}

export default ClassTeacherResults