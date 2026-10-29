import { createContext, useContext, useState, useEffect } from "react"

// Holds the school's name, logo, sidebar color and login pictures — saved in
// MongoDB and shared live across the whole app.

const BrandingContext = createContext(null)

const API = "http://localhost:5000/api/branding"

const defaultBranding = {
  schoolName: "School MIS",
  logoUrl: null, // null = use the default placeholder icon
  sidebarColor: "#30497D",
  loginBgUrls: [], // empty = plain login background
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding)

  // Load the saved branding from the database when the app starts
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API)
        const data = await res.json()

        // Older saves only had one picture; still show it
        let pictures = Array.isArray(data.loginBgUrls) ? data.loginBgUrls : []
        if (pictures.length === 0 && data.loginBgUrl) pictures = [data.loginBgUrl]

        setBranding({
          schoolName: data.schoolName || defaultBranding.schoolName,
          logoUrl: data.logoUrl || null,
          sidebarColor: data.sidebarColor || defaultBranding.sidebarColor,
          loginBgUrls: pictures,
        })
      } catch (err) {
        console.error("Could not load branding:", err)
      }
    }
    load()
  }, [])

  // Saves to the database, then updates the screen instantly
  async function updateBranding(updates) {
    const next = { ...branding, ...updates }
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
    if (!res.ok) throw new Error("Could not save branding")
    setBranding(next)
  }

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  return useContext(BrandingContext)
}