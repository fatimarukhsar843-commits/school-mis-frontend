import { useState, useEffect, useRef } from "react"
import html2canvas from "html2canvas"
import { getStudentResult, getPassPercentage } from "./Exams"

// A decorated, printable-style result card for one student in one exam.
// position is optional — pass it in when you have class ranking available.
function ResultCard({ student, examName, className, examId, position, onClose }) {
  const cardRef = useRef(null)
  const [result, setResult] = useState(null)
  const [passPercent, setPassPercent] = useState(40)

  useEffect(() => {
    async function load() {
      setResult(await getStudentResult(examId, student._id, className))
      setPassPercent(await getPassPercentage())
    }
    load()
  }, [examId, student._id, className])

  async function handleDownload() {
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2, // higher resolution output
    })
    const link = document.createElement("a")
    link.download = `${student.name.replace(/\s+/g, "_")}_${examName}_ResultCard.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  if (!result) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-gray-500">Loading...</div>
      </div>
    )
  }

  const isPass = result.status === "pass"
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Everything inside cardRef is what gets captured as the downloadable image */}
        <div ref={cardRef} className="bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-6 py-5 text-center">
          <p className="text-sm uppercase tracking-wide opacity-80">School MIS</p>
          <h2 className="text-xl font-bold">{examName} — Result Card</h2>
        </div>

        <div className="p-6">
          {/* Student info */}
          <div className="flex items-center justify-between mb-4">
            <div>
                            <p className="text-lg font-semibold">{student.name}</p>
              <p className="text-sm text-gray-500">Father: {student.guardian || "—"}</p>
              <p className="text-sm text-gray-500">
                Class {className} &middot; Roll No {student.rollNo}
              </p>
            </div>
            {medal && (
              <div className="text-right">
                <p className="text-3xl">{medal}</p>
                <p className="text-xs font-medium text-gray-500">Position {position}</p>
              </div>
            )}
            {!medal && position && (
              <p className="text-sm font-medium text-gray-500">Position {position}</p>
            )}
          </div>

          {/* Subject marks table */}
          <table className="w-full text-left mb-4 border rounded overflow-hidden">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2 text-right">Obtained</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.subjectId} className="border-t">
                  <td className="px-3 py-2">{row.subject}</td>
                  <td className="px-3 py-2 text-right">{row.obtained}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{row.max}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{result.totalObtained}</td>
                <td className="px-3 py-2 text-right text-gray-500">{result.totalMax}</td>
              </tr>
            </tfoot>
          </table>

          {/* Percentage + Pass/Fail */}
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Percentage</p>
            <p className="text-4xl font-bold mb-2">{result.percentage.toFixed(1)}%</p>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {isPass ? "PASS" : "FAIL"}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Pass mark: {passPercent}%
            </p>

            {isPass && (
              <p className="mt-3 text-cyan-700 font-medium">
                {medal ? `${medal} Congratulations! ` : "🎉 Congratulations! "}
                Great job on your result.
              </p>
            )}
          </div>
        </div>
        {/* end of captured area */}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-medium"
          >
            Download as Image
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultCard