import { useState, useEffect } from "react"
import { getStudentsByClass } from "./Students"
import { getClassList, getBaseClassName } from "./Classes"
import { getExams, getSubjectsForClass, getClassRanking, getPublishedResults } from "./Exams"
import ResultCard from "./ResultCard"
import PrintableResultCards from "./PrintableResultCards"
import { useBranding } from "./BrandingContext"

function AdminResultsOverview() {
  const { branding } = useBranding()
  const classOptions = getClassList()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [examId, setExamId] = useState("")
  const [classSummaries, setClassSummaries] = useState([])
  const [expandedClass, setExpandedClass] = useState(null)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [printingClass, setPrintingClass] = useState(null)

  // Load exams once
  useEffect(() => {
    async function load() {
      const list = await getExams()
      setExams(list)
      if (list.length > 0) setExamId(list[0]._id)
      setLoading(false)
    }
    load()
  }, [])

  // Build a summary row for every class that the class teacher has PUBLISHED
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!examId) return

      // NEW: ask the database which classes are published for this exam
      const published = await getPublishedResults(examId)
      const publishedNames = published.map((p) => p.className)

      // NEW: keep only the published classes
      const visibleClasses = classOptions.filter((c) => publishedNames.includes(c))

      const rows = await Promise.all(
        visibleClasses.map(async (className) => {
          const subjects = await getSubjectsForClass(getBaseClassName(className))
          if (subjects.length === 0) return null
          const students = await getStudentsByClass(className)
          const ranking = await getClassRanking(examId, className, students)
          const passed = ranking.filter((r) => r.result.status === "pass").length
          return { className, ranking, total: ranking.length, passed, failed: ranking.length - passed }
        })
      )
      if (!cancelled) setClassSummaries(rows.filter(Boolean))
    }
    load()
    return () => { cancelled = true }
  }, [examId])

  useEffect(() => {
    if (!printingClass) return
    const timer = setTimeout(() => window.print(), 150)
    function handleAfterPrint() {
      setPrintingClass(null)
    }
    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [printingClass])

  if (loading) {
    return <p className="text-gray-400">Loading...</p>
  }

  if (exams.length === 0) {
    return <p className="text-gray-500">No exams have been created yet.</p>
  }

  const selectedExam = exams.find((e) => e._id === examId)
  const expandedSummary = classSummaries.find((c) => c.className === expandedClass)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Results Overview</h1>

      <select
        value={examId}
        onChange={(e) => setExamId(e.target.value)}
        className="border rounded px-3 py-2 mb-4"
      >
        {exams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
      </select>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Passed</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">Top 3</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {classSummaries.map((c) => (
              <tr key={c.className} className="border-t">
                <td className="px-4 py-3 font-medium">Class {c.className}</td>
                <td className="px-4 py-3">{c.total}</td>
                <td className="px-4 py-3 text-green-700">{c.passed}</td>
                <td className="px-4 py-3 text-red-600">{c.failed}</td>
                <td className="px-4 py-3">
                  {c.ranking.slice(0, 3).map((r, i) => (
                    <span key={r.student._id} className="mr-2">
                      {["🥇", "🥈", "🥉"][i]} {r.student.name}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 space-x-3">
                  <button
                    onClick={() => setExpandedClass(expandedClass === c.className ? null : c.className)}
                    className="text-cyan-600 hover:underline text-sm"
                  >
                    {expandedClass === c.className ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => setPrintingClass(c.className)}
                    className="text-gray-600 hover:underline text-sm"
                  >
                    🖨️ Print Results
                  </button>
                </td>
              </tr>
            ))}
            {classSummaries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No class has published results for this exam yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {expandedSummary && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
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
              {expandedSummary.ranking.map(({ student, result, position }) => {
                const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null
                const isPass = result.status === "pass"
                return (
                  <tr key={student._id} className="border-t">
                    <td className="px-4 py-3 font-medium">{medal ? <span className="text-lg">{medal}</span> : position}</td>
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{result.totalObtained} / {result.totalMax}</td>
                    <td className="px-4 py-3">{result.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
            </tbody>
          </table>
        </div>
      )}

      {viewingStudent && expandedSummary && (
        <ResultCard
          student={viewingStudent.student}
          position={viewingStudent.position}
          examId={examId}
          examName={selectedExam?.name}
          className={expandedSummary.className}
          onClose={() => setViewingStudent(null)}
        />
      )}

      {printingClass && (
        <PrintableResultCards
          examName={selectedExam?.name}
          className={printingClass}
          ranking={classSummaries.find((c) => c.className === printingClass)?.ranking || []}
          schoolName={branding.schoolName}
        />
      )}
    </div>
  )
}

export default AdminResultsOverview