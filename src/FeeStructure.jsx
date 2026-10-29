import { useState, useEffect } from "react"
import { getFeeStructure, saveFeeStructure } from "./Fees"
import { getGradeNames } from "./Classes"

function FeeStructure() {
  const [structure, setStructure] = useState({})
  const [saved, setSaved] = useState(false)
  const gradeOptions = getGradeNames()

  useEffect(() => {
    getFeeStructure().then(setStructure)
  }, [])

  function handleChange(className, value) {
    setStructure((prev) => ({ ...prev, [className]: value }))
    setSaved(false)
  }

  async function handleSave() {
    await saveFeeStructure(structure)
    setSaved(true)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Fee Structure</h1>
      <p className="text-gray-500 mb-4">
        Set the monthly fee per grade — every section (A, B, C) of a class pays the same fee.
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden max-w-md">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Monthly Fee (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {gradeOptions.map((className) => (
              <tr key={className} className="border-t">
                <td className="px-4 py-3">Class {className}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={structure[className] ?? ""}
                    onChange={(e) => handleChange(className, e.target.value)}
                    className="w-28 p-1.5 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          Save Fee Structure
        </button>
        {saved && <span className="text-green-600 text-sm">Saved!</span>}
      </div>
    </div>
  )
}

export default FeeStructure