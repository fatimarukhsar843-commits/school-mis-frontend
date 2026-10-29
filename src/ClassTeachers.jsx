import { useState, useEffect } from "react"
import { getTeachers, updateTeacher } from "./Teachers"
import { getClassList } from "./Classes"

function ClassTeachers() {
  const sections = getClassList()
  const [teachers, setTeachers] = useState([])
  const [saving, setSaving] = useState("")

  async function refresh() {
    setTeachers(await getTeachers())
  }

  useEffect(() => {
    refresh()
  }, [])

  function teacherOf(section) {
    return teachers.find((t) => t.classTeacherOf === section)
  }

  // Send the full teacher data with a new classTeacherOf value
  function buildData(t, classTeacherOf) {
    return {
      name: t.name,
      subject: t.subject,
      phone: t.phone,
      salary: t.salary,
      loginEmail: t.loginEmail,
      classTeacherOf,
    }
  }

  async function handleAssign(section, newTeacherId) {
    setSaving(section)
    try {
      const current = teacherOf(section)

      // 1. Free the section from its current class teacher
      if (current && current._id !== newTeacherId) {
        await updateTeacher(current._id, buildData(current, ""))
      }

      // 2. Give the section to the new teacher
      if (newTeacherId) {
        const newTeacher = teachers.find((t) => t._id === newTeacherId)
        if (newTeacher.classTeacherOf && newTeacher.classTeacherOf !== section) {
          if (!confirm(`${newTeacher.name} is already class teacher of ${newTeacher.classTeacherOf}. Move them to ${section}?`)) {
            setSaving("")
            return
          }
        }
        await updateTeacher(newTeacherId, buildData(newTeacher, section))
      }
      await refresh()
    } catch (err) {
      console.error(err)
      alert("Could not save. Please try again.")
    }
    setSaving("")
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Class Teachers</h1>
      <p className="text-gray-500 mb-4">
        Each class has one class teacher. The class teacher manages subjects, enters marks
        and publishes the results for their class.
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Class Teacher</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec) => {
              const current = teacherOf(sec)
              return (
                <tr key={sec} className="border-t">
                  <td className="px-4 py-3 font-medium">Class {sec}</td>
                  <td className="px-4 py-3">
                    <select
                      value={current?._id || ""}
                      disabled={saving === sec}
                      onChange={(e) => handleAssign(sec, e.target.value)}
                      className="border rounded px-3 py-1.5 w-full max-w-xs"
                    >
                      <option value="">-- Not assigned --</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                          {t.classTeacherOf && t.classTeacherOf !== sec
                            ? ` (now: ${t.classTeacherOf})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
            {sections.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                  No classes found. Add classes under "Classes & Sections" first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ClassTeachers