import { useState, useEffect } from "react"
import { useBranding } from "./BrandingContext"

const MAX_PICTURES = 5

// Shrinks a picture to at most maxWidth pixels wide and returns a JPEG data URL
function shrinkImage(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function BrandingSettings() {
  const { branding, updateBranding } = useBranding()
  const [schoolName, setSchoolName] = useState(branding.schoolName)
  const [sidebarColor, setSidebarColor] = useState(branding.sidebarColor)
  const [logoPreview, setLogoPreview] = useState(branding.logoUrl)
  const [pictures, setPictures] = useState(branding.loginBgUrls || [])
  const [saved, setSaved] = useState(false)

  // The saved branding may finish loading after this page opens
  useEffect(() => {
    setSchoolName(branding.schoolName)
    setSidebarColor(branding.sidebarColor)
    setLogoPreview(branding.logoUrl)
    setPictures(branding.loginBgUrls || [])
  }, [branding])

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose a logo smaller than 2 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handlePicturesChange(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = "" // lets the same file be chosen again later
    if (files.length === 0) return

    const room = MAX_PICTURES - pictures.length
    if (room <= 0) {
      alert(`You can add up to ${MAX_PICTURES} pictures. Remove one first.`)
      return
    }
    if (files.length > room) {
      alert(`Only ${room} more picture(s) can be added. The extra ones were skipped.`)
    }

    const added = []
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) continue
      try {
        added.push(await shrinkImage(file, 1400))
      } catch (err) {
        alert(`Could not read "${file.name}". Please try another one.`)
      }
    }
    if (added.length > 0) {
      setPictures((prev) => [...prev, ...added])
      setSaved(false)
    }
  }

  function removePicture(index) {
    setPictures((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  async function handleSave() {
    try {
      await updateBranding({
        schoolName,
        sidebarColor,
        logoUrl: logoPreview,
        loginBgUrls: pictures,
      })
      setSaved(true)
    } catch (err) {
      console.error(err)
      alert("Could not save branding. Please try again.")
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Branding</h1>
      <p className="text-gray-500 mb-4">
        Customize how the app looks for your school — this appears in the
        sidebar, as a light watermark on every page, and on the login page.
      </p>
      <div className="bg-white rounded-lg shadow p-4 max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">School Name</label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => { setSchoolName(e.target.value); setSaved(false) }}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">School Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { handleLogoChange(e); setSaved(false) }}
            className="text-sm"
          />
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo preview"
              className="mt-2 w-16 h-16 object-contain border rounded bg-gray-50"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Login Page Pictures ({pictures.length}/{MAX_PICTURES})
          </label>
          <p className="text-xs text-gray-500 mb-1">
            Add up to {MAX_PICTURES} wide (landscape) photos. They change one after
            another on the login page. With only one picture, it stays still.
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePicturesChange}
            className="text-sm"
          />
          {pictures.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {pictures.map((pic, i) => (
                <div key={i} className="relative">
                  <img
                    src={pic}
                    alt={`Login picture ${i + 1}`}
                    className="w-full h-24 object-cover border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePicture(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sidebar Color</label>
          <input
            type="color"
            value={sidebarColor}
            onChange={(e) => { setSidebarColor(e.target.value); setSaved(false) }}
            className="w-16 h-10 border rounded cursor-pointer"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          Save Branding
        </button>
        {saved && (
          <p className="text-green-600 text-sm text-center">
            Saved! Check the sidebar and the login page — they update instantly.
          </p>
        )}
      </div>
    </div>
  )
}

export default BrandingSettings