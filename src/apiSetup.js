const API_BASE = "http://localhost:5000/api"
const originalFetch = window.fetch.bind(window)

function getToken() {
  try {
    return JSON.parse(localStorage.getItem("mis_user"))?.token || null
  } catch {
    return null
  }
}

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url

  // Only touch requests to our own backend
  if (!url.startsWith(API_BASE)) {
    return originalFetch(input, init)
  }

  const token = getToken()
  const headers = new Headers(init.headers || {})
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await originalFetch(input, { ...init, headers })

  // Token missing, wrong or expired -> back to the login page
  if (response.status === 401 && token) {
    localStorage.removeItem("mis_user")
    window.location.href = "/login"
  }

  return response
}