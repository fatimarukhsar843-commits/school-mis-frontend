// Fake "branding settings" — admin-editable school name, logo, and sidebar color.
// Swap this for a real database record per-school once you have a backend.

let branding = {
  schoolName: "Al-Khidmat Foundation School Tangi Campus",
  logoUrl: null, // a data URL once admin uploads one; null = use the default icon
  sidebarColor: "#111827", // hex color, matches the default dark sidebar
}

export function getBranding() {
  return branding
}

export function setBranding(updates) {
  branding = { ...branding, ...updates }
}
