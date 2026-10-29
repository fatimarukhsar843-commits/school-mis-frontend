import { useState, useEffect } from "react"
import { getExams, addExam } from "./Exams"

function ClassTeacherExams() {
  const [exams, setExams] = useState([])
  const [newExamName, setNewExamName] = useState("")
  const [error, setError] = useState("")

  async function refresh() {
    setExams(await getExams())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAddExam() {
    const name = newExamName.trim()
    if (!name) return
    const exists = exams.some((e) => e.name.toLowerCase() === name.toLowerCase())
    if (exists) {
      setError(`"${name}" already exists — all classes share the same exams.`)
      return
    }
    setError("")
    await addExam(name)
    setNewExamName("")
    refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Exams</h1>
      <p className="text-gray-500 mb-4">
        Exams are shared by the whole school. If your exam (e.g. "Mid Term") is not in the
        list yet, add it here. Only the admin can delete an exam.
      </p>

      <div className="bg-white rounded-lg shadow p-4 max-w-md">
        <div className="space-y-2 mb-3">
          {exams.map((e) => (
            <div key={e._id} className="bg-gray-50 px-3 py-2 rounded">
              {e.name}
            </div>
          ))}
          {exams.length === 0 && (
            <p className="text-sm text-gray-400">No exams added yet.</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Mid Term"
            value={newExamName}
            onChange={(e) => { setNewExamName(e.target.value); setError("") }}
            className="border rounded px-3 py-1.5 flex-1"
          />
          <button
            onClick={handleAddExam}
            className="px-4 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm"
          >
            + Add Exam
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  )
}

export default ClassTeacherExams