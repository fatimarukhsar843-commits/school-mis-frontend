import { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getTeacherByLoginEmail } from "./Teachers"
import { getBaseClassName } from "./Classes"
import { getSubjectsForClass, addSubject, updateSubject, removeSubject } from "./Exams"

function ClassTeacherSubjects() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState("")
  const [subjects, setSubjects] = useState([])
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newSubjectMax, setNewSubjectMax] = useState(100)

  const grade = section ? getBaseClassName(section) : ""

  async function refresh() {
    if (!grade) return
    setSubjects(await getSubjectsForClass(grade))
  }

  useEffect(() => {
    async function load() {
      const t = await getTeacherByLoginEmail(user?.email)
      setSection(t?.classTeacherOf || "")
      setLoading(false)
    }
    load()
  }, [user?.email])

  useEffect(() => {
    refresh()
  }, [grade])

  async function handleAddSubject() {
    if (!newSubjectName.trim()) return
    await addSubject(grade, newSubjectName.trim(), Number(newSubjectMax))
    setNewSubjectName("")
    setNewSubjectMax(100)
    refresh()
  }

  async function handleMaxMarksSave(subjectId, value) {
    await updateSubject(grade, subjectId, { maxMarks: Number(value) })
    refresh()
  }

  async function handleRemoveSubject(subjectId) {
    if (confirm("Remove this subject? Any marks entered for it will also be deleted.")) {
      await removeSubject(grade, subjectId)
      refresh()
    }
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  if (!section) {
    return (
      <p className="text-gray-500">
        You are not a class teacher yet. Ask the admin to assign you a class.
      </p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Subjects — Class {grade}</h1>
      <p className="text-gray-500 mb-4">
        You are the class teacher of {section}. These subjects apply to the whole of
        Class {grade}, so every section of this grade uses the same list.
      </p>

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
                    defaultValue={s.maxMarks}
                    onBlur={(e) => handleMaxMarksSave(s._id, e.target.value)}
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

export default ClassTeacherSubjects