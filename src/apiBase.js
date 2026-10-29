const LOCAL = "http://localhost:5000"
const API = import.meta.env.VITE_API_URL

if (API && API !== LOCAL) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith(LOCAL)) {
      return originalFetch(API + input.slice(LOCAL.length), init)
    }
    return originalFetch(input, init)
  }
}