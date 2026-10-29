import { useState, useEffect } from "react"
import { getPassPercentage } from "./Exams"

// Renders one result card per student, formatted for printing.
// This component is invisible on screen — it only appears when printing
// (see the print CSS rules in index.css). Each card starts on its own page.
function PrintableResultCards({ examName, className, ranking, schoolName }) {
  const [passPercent, setPassPercent] = useState(40)

  useEffect(() => {
    async function load() {
      setPassPercent(await getPassPercentage())
    }
    load()
  }, [])

  return (
    <div className="print-area">
      {ranking.map(({ student, result, position }) => {
        const isPass = result.status === "pass"
        const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null

        return (
          <div key={student._id} className="print-card">
            <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
              <p className="text-sm uppercase tracking-wide text-gray-500">{schoolName}</p>
              <h2 className="text-xl font-bold">{examName} — Result Card</h2>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                                <p className="text-lg font-semibold">{student.name}</p>
                <p className="text-sm text-gray-600">Father: {student.guardian || "—"}</p>
                <p className="text-sm text-gray-600">
                  Class {className} &middot; Roll No {student.rollNo}
                </p>
              </div>
              {position && (
                <p className="text-sm font-medium">
                  Position: {medal || position}
                </p>
              )}
            </div>

            <table className="w-full text-left border-collapse mb-4">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="py-2">Subject</th>
                  <th className="py-2 text-right">Obtained</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.subjectId} className="border-b border-gray-300">
                    <td className="py-2">{row.subject}</td>
                    <td className="py-2 text-right">{row.obtained}</td>
                    <td className="py-2 text-right text-gray-500">{row.max}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{result.totalObtained}</td>
                  <td className="py-2 text-right text-gray-600">{result.totalMax}</td>
                </tr>
              </tfoot>
            </table>

            <div className="text-center">
              <p className="text-sm text-gray-600">Percentage</p>
              <p className="text-3xl font-bold">{result.percentage.toFixed(1)}%</p>
              <p className="text-lg font-bold mt-1">
                {isPass ? "PASS" : "FAIL"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pass mark: {passPercent}%</p>
              {isPass && (
                <p className="mt-2 font-medium">
                  {medal ? `${medal} Congratulations!` : "Congratulations!"}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PrintableResultCards