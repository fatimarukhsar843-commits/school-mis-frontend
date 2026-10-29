import { useState, useEffect } from "react"
import { addStudent, updateStudent, getStudents } from "./Students"
import { getClassList } from "./Classes"

// Crops the photo to a centred square and shrinks it, so it stays small
function resizePhoto(file, size = 240) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        const target = Math.min(size, side)
        const canvas = document.createElement("canvas")
        canvas.width = target
        canvas.height = target
        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, target, target)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function todayDate() {
  return new Date().toISOString().split("T")[0]
}

// If `student` is passed in, we're editing. If it's null, we're adding new.
function StudentForm({ student, onClose }) {
  const isEditMode = Boolean(student)
  const classOptions = getClassList()

  const [allStudents, setAllStudents] = useState([])
  const [photoUrl, setPhotoUrl] = useState(student?.photoUrl || "")
  const [name, setName] = useState(student?.name || "")
  const [className, setClassName] = useState(student?.className || classOptions[0])
  const [regNo, setRegNo] = useState(student?.regNo || "")
  const [gender, setGender] = useState(student?.gender || "")
  const [dateOfBirth, setDateOfBirth] = useState(student?.dateOfBirth || "")
  const [admissionDate, setAdmissionDate] = useState(student?.admissionDate || todayDate())
  const [guardian, setGuardian] = useState(student?.guardian || "")
  const [phone, setPhone] = useState(student?.phone || "")
  const [parentEmail, setParentEmail] = useState(student?.parentEmail || "")
  const [address, setAddress] = useState(student?.address || "")
  const [bFormCnic, setBFormCnic] = useState(student?.bFormCnic || "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setAllStudents(await getStudents())
    }
    load()
  }, [])

  // Preview of the roll number (the server makes the final decision)
  function rollNoPreview() {
    if (isEditMode && className === student.className) return student.rollNo
    const highest = allStudents
      .filter((s) => s.className === className && s._id !== student?._id)
      .reduce((max, s) => {
        const n = parseInt(s.rollNo, 10)
        return Number.isNaN(n) ? max : Math.max(max, n)
      }, 0)
    return String(highest + 1)
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.")
      return
    }
    try {
      setPhotoUrl(await resizePhoto(file))
    } catch {
      alert("Could not read that photo. Please try another one.")
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Reg. No must be unique across the whole school
    const clash = allStudents.find(
      (s) => s._id !== student?._id && (s.regNo || "").trim() === regNo.trim()
    )
    if (clash) {
      alert(`Reg. No ${regNo} is already used by ${clash.name}.`)
      return
    }

    setSaving(true)

    // The roll number is not sent — the server assigns it
    const data = {
      name, className, regNo: regNo.trim(), guardian, phone, parentEmail,
      photoUrl, gender, dateOfBirth, admissionDate, address, bFormCnic,
    }

    try {
      if (isEditMode) {
        await updateStudent(student._id, data)
      } else {
        await addStudent(data)
      }
      onClose()
    } catch (err) {
      console.error("Failed to save student:", err)
      alert("Could not save the student. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {isEditMode ? "Edit Student" : "Add Student"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Photo */}
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Student"
                className="w-24 h-24 rounded-full object-cover border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400 text-3xl">
                {name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="space-y-2">
              <label className="inline-block px-3 py-1.5 border rounded cursor-pointer hover:bg-gray-50 text-sm">
                {photoUrl ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="block text-red-500 hover:underline text-sm"
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-gray-400">Shrunk automatically to a small square.</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Student Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Reg. No"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <p className="text-sm text-cyan-700 bg-cyan-50 rounded px-3 py-2">
            Roll No {isEditMode && className === student.className ? "is" : "will be assigned automatically:"}{" "}
            <strong>{rollNoPreview()}</strong> (in Class {className})
          </p>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Date of birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Admission date</label>
            <input
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <input
            type="text"
            placeholder="Father / Guardian Name"
            value={guardian}
            onChange={(e) => setGuardian(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Parent Login Email (for Parent Portal access)"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="B-Form / CNIC number"
            value={bFormCnic}
            onChange={(e) => setBFormCnic(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Home address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full p-2 border rounded"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditMode ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentForm