import { useState, useEffect } from "react"
import { loadGrades, getGrades, addGrade, removeGrade, addSection, removeSection } from "./Classes"

function ClassesManage() {
  const [grades, setGrades] = useState(getGrades())
  const [newGradeName, setNewGradeName] = useState("")
  const [newSectionInputs, setNewSectionInputs] = useState({}) // { gradeId: "typed text" }

  async function refresh() {
    await loadGrades()
    setGrades([...getGrades()])
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAddGrade() {
    if (!newGradeName.trim()) return
    await addGrade(newGradeName.trim())
    setNewGradeName("")
    setGrades([...getGrades()])
  }

  async function handleRemoveGrade(id) {
    if (confirm("Remove this class entirely, including all its sections?")) {
      await removeGrade(id)
      setGrades([...getGrades()])
    }
  }

  async function handleAddSection(gradeId) {
    const value = (newSectionInputs[gradeId] || "").trim()
    if (!value) return
    await addSection(gradeId, value)
    setNewSectionInputs((prev) => ({ ...prev, [gradeId]: "" }))
    setGrades([...getGrades()])
  }

  async function handleRemoveSection(gradeId, section) {
    await removeSection(gradeId, section)
    setGrades([...getGrades()])
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Classes & Sections</h1>
      <p className="text-gray-500 mb-4">
        Set up each grade and its sections (e.g. "1" with sections "A", "B", "C"
        becomes selectable as 1-A, 1-B, 1-C everywhere in the app). A grade with
        no sections just stays as itself — useful for Play Group, Nursery, KG.
      </p>

      <div className="space-y-4 max-w-xl">
        {grades.map((g) => (
          <div key={g._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Class {g.name}</h2>
              <button
                onClick={() => handleRemoveGrade(g._id)}
                className="text-red-500 hover:underline text-sm"
              >
                Remove Class
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {g.sections.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-sm"
                >
                  Section {s}
                  <button
                    onClick={() => handleRemoveSection(g._id, s)}
                    className="text-cyan-700 hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {g.sections.length === 0 && (
                <span className="text-sm text-gray-400">No sections — used as a single class.</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. A, B, C"
                value={newSectionInputs[g._id] || ""}
                onChange={(e) =>
                  setNewSectionInputs((prev) => ({ ...prev, [g._id]: e.target.value }))
                }
                className="border rounded px-3 py-1.5 text-sm flex-1"
              />
              <button
                onClick={() => handleAddSection(g._id)}
                className="px-3 py-1.5 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700"
              >
                + Add Section
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="New class name (e.g. 11 or Montessori)"
          value={newGradeName}
          onChange={(e) => setNewGradeName(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={handleAddGrade}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          + Add Class
        </button>
      </div>
    </div>
  )
}

export default ClassesManage