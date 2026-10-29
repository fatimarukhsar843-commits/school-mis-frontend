import { useState, useEffect } from "react"
import { getExams, addExam, removeExam, getPassPercentage, setPassPercentage } from "./Exams"

function ExamsManage() {
  const [exams, setExams] = useState([])
  const [newExamName, setNewExamName] = useState("")
  const [passPercent, setPassPercent] = useState(40)
  const [saved, setSaved] = useState(false)

  async function refresh() {
    setExams(await getExams())
  }

  useEffect(() => {
    async function load() {
      setExams(await getExams())
      setPassPercent(await getPassPercentage())
    }
    load()
  }, [])

  async function handleAddExam() {
    if (!newExamName.trim()) return
    await addExam(newExamName.trim())
    setNewExamName("")
    refresh()
  }

  async function handleRemoveExam(id) {
    if (confirm("Remove this exam? All marks entered for it will also be deleted.")) {
      await removeExam(id)
      refresh()
    }
  }

  async function handleSavePassPercent() {
    await setPassPercentage(Number(passPercent))
    setSaved(true)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Exams</h1>

      {/* Exam list */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-md">
        <h2 className="text-lg font-semibold mb-3">Exam Types</h2>
        <p className="text-sm text-gray-500 mb-3">
          e.g. "Mid Term", "Final Term" — each is tracked completely separately.
        </p>

        <div className="space-y-2 mb-3">
          {exams.map((e) => (
            <div key={e._id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
              <span>{e.name}</span>
              <button
                onClick={() => handleRemoveExam(e._id)}
                className="text-red-500 hover:underline text-sm"
              >
                Remove
              </button>
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
            onChange={(e) => setNewExamName(e.target.value)}
            className="border rounded px-3 py-1.5 flex-1"
          />
          <button
            onClick={handleAddExam}
            className="px-4 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm"
          >
            + Add Exam
          </button>
        </div>
      </div>

      {/* Pass percentage setting */}
      <div className="bg-white rounded-lg shadow p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Pass Percentage</h2>
        <p className="text-sm text-gray-500 mb-3">
          Students scoring below this percentage will show as FAIL on their result card.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={passPercent}
            onChange={(e) => { setPassPercent(e.target.value); setSaved(false) }}
            className="w-24 p-2 border rounded"
          />
          <span>%</span>
          <button
            onClick={handleSavePassPercent}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm ml-2"
          >
            Save
          </button>
          {saved && <span className="text-green-600 text-sm">Saved!</span>}
        </div>
      </div>
    </div>
  )
}

export default ExamsManage