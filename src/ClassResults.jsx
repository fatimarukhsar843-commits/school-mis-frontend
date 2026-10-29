import { useState, useEffect } from "react"
import { getStudentsByClass } from "./Students"
import { getClassList, getBaseClassName } from "./Classes"
import { getExams, getSubjectsForClass, getClassRanking } from "./Exams"
import ResultCard from "./ResultCard"

function ClassResults() {
  const classOptions = getClassList()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [examId, setExamId] = useState("")
  const [className, setClassName] = useState(classOptions[0] || "")
  const [subjects, setSubjects] = useState([])
  const [ranking, setRanking] = useState([])
  const [viewingStudent, setViewingStudent] = useState(null)

  useEffect(() => {
    async function load() {
      const list = await getExams()
      setExams(list)
      if (list.length > 0) setExamId(list[0]._id)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!examId || !className) return
      const subs = await getSubjectsForClass(getBaseClassName(className))
      const students = await getStudentsByClass(className)
      const rank = subs.length > 0 ? await getClassRanking(examId, className, students) : []
      if (!cancelled) {
        setSubjects(subs)
        setRanking(rank)
      }
    }
    load()
    return () => { cancelled = true }
  }, [examId, className])

  const selectedExam = exams.find((e) => e._id === examId)

  if (loading) {
    return <p className="text-gray-400">Loading...</p>
  }

  if (exams.length === 0) {
    return (
      <p className="text-gray-500">
        No exams have been created yet. Go to "Exams" in the sidebar to add one first.
      </p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Class Results</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {exams.map((e) => (
            <option key={e._id} value={e._id}>{e.name}</option>
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

      {subjects.length === 0 ? (
        <p className="text-gray-500">
          No subjects set for Class {getBaseClassName(className)} yet.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Obtained / Total</th>
                <th className="px-4 py-3">Percentage</th>
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
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{result.totalObtained} / {result.totalMax}</td>
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
                        className="text-cyan-600 hover:underline text-sm"
                      >
                        View Result Card
                      </button>
                    </td>
                  </tr>
                )
              })}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
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
          className={className}
          onClose={() => setViewingStudent(null)}
        />
      )}
    </div>
  )
}

export default ClassResults