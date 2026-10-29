import { useState, useEffect } from "react"
import { getSubjectsForClass, addSubject, updateSubject, removeSubject } from "./Exams"
import { getGradeNames } from "./Classes"

function SubjectsManage() {
  const gradeOptions = getGradeNames()
  const [className, setClassName] = useState(gradeOptions[0])
  const [subjects, setSubjects] = useState([])
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newSubjectMax, setNewSubjectMax] = useState(100)

  async function refresh(cls = className) {
    const data = await getSubjectsForClass(cls)
    setSubjects(data)
  }

  useEffect(() => {
    refresh(className)
  }, [className])

  function handleClassChange(cls) {
    setClassName(cls)
  }

  async function handleAddSubject() {
    if (!newSubjectName.trim()) return
    await addSubject(className, newSubjectName.trim(), newSubjectMax)
    setNewSubjectName("")
    setNewSubjectMax(100)
    refresh()
  }

  async function handleMaxMarksChange(subjectId, value) {
    await updateSubject(className, subjectId, { maxMarks: Number(value) })
    refresh()
  }

  async function handleRemoveSubject(subjectId) {
    if (confirm("Remove this subject? Any marks entered for it will also be deleted.")) {
      await removeSubject(className, subjectId)
      refresh()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Subjects per Class</h1>
      <p className="text-gray-500 mb-4">
        Subjects apply to the whole grade — every section (A, B, C) studies the same subjects.
      </p>

      <select
        value={className}
        onChange={(e) => handleClassChange(e.target.value)}
        className="border rounded px-3 py-2 mb-4"
      >
        {gradeOptions.map((c) => (
          <option key={c} value={c}>Class {c}</option>
        ))}
      </select>

      <div className="bg-white rounded-lg shadow overflow-hidden max-w-md mb-4">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Max Marks</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={s.maxMarks}
                    onChange={(e) => handleMaxMarksChange(s._id, e.target.value)}
                    className="w-20 p-1.5 border rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemoveSubject(s._id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  No subjects added for this class yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 max-w-md">
        <input
          type="text"
          placeholder="Subject name (e.g. Mathematics)"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <input
          type="number"
          placeholder="Max Marks"
          value={newSubjectMax}
          onChange={(e) => setNewSubjectMax(e.target.value)}
          className="border rounded px-3 py-2 w-28"
        />
        <button
          onClick={handleAddSubject}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          + Add Subject
        </button>
      </div>
    </div>
  )
}

export default SubjectsManage