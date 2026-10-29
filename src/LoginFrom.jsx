import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { useBranding } from "./BrandingContext"
import { parentSignup } from "./Accounts"

// How many seconds each background picture stays before the next one fades in
const SECONDS_PER_PICTURE = 2

function LoginFrom() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  // Safe even if the branding has not loaded yet
  const brandingContext = useBranding()
  const branding = brandingContext?.branding
  const pictures = branding?.loginBgUrls || []
  const logoUrl = branding?.logoUrl || null
  const schoolName = branding?.schoolName || ""

  // With background pictures the box turns into transparent "glass"
  const glass = pictures.length > 0

  // Which picture is showing now
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (pictures.length < 2) {
      setSlide(0)
      return
    }
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % pictures.length)
    }, SECONDS_PER_PICTURE * 1000)
    return () => clearInterval(timer)
  }, [pictures.length])

  const cardClass = glass
    ? "relative w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md border border-white/30"
    : "relative w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"

  const inputClass = glass
    ? "w-full p-3 border-b-2 border-white/70 outline-none focus:border-white bg-transparent text-white placeholder-white/70 [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [transition:background-color_9999s_ease-in-out_0s]"
    : "w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"

  function switchMode(loginMode) {
    setIsLoginMode(loginMode)
    setError("")
    setSuccess("")
    setPassword("")
    setConfirmPassword("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Parent sign up
    if (!isLoginMode) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        return
      }
      if (password !== confirmPassword) {
        setError("The two passwords don't match.")
        return
      }
      try {
        await parentSignup({ name, email, password })
        setIsLoginMode(true)
        setPassword("")
        setConfirmPassword("")
        setSuccess("Account created! Please log in.")
      } catch (err) {
        setError(err.message)
      }
      return
    }

    // Login
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      login({ ...data.user, token: data.token })

      if (data.user.role === "admin") navigate("/admin")
      else if (data.user.role === "teacher") navigate("/teacher")
      else navigate("/parent")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden">
      {/* the school name comes and goes every 5 seconds */}
      <style>{`
        @keyframes schoolNameFade {
          0%   { opacity: 0; transform: translateY(-14px); }
          30%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-14px); }
        }
      `}</style>

      {/* background pictures, fading from one to the next */}
      {pictures.map((pic, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${pic})`, opacity: i === slide ? 1 : 0 }}
        ></div>
      ))}

      {/* soft dark layer so the glass box stays easy to read */}
      {glass && <div className="absolute inset-0 bg-black/40"></div>}

      {/* school name */}
      {schoolName && (
        <h1
          className={`relative mb-6 text-3xl sm:text-5xl font-bold text-center opacity-0 ${
            glass ? "text-white drop-shadow-lg" : "text-[#30497D]"
          }`}
          style={{ animation: "schoolNameFade 5s ease-in-out infinite" }}
        >
          {schoolName}
        </h1>
      )}

      <div className={cardClass}>
        {/* school logo */}
        {logoUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={logoUrl}
              alt="School logo"
              className={`w-16 h-16 object-contain ${glass ? "rounded-lg bg-white/90 p-1" : ""}`}
            />
          </div>
        )}

        {/* header title */}
        <div className="flex justify-center mb-4">
          <h2 className={`text-3xl font-semibold text-center ${glass ? "text-white" : ""}`}>
            {isLoginMode ? "Login" : "Parent Sign Up"}
          </h2>
        </div>

        {/* tab control */}
        <div className="relative flex h-12 mb-6 border-gray-300 rounded-full overflow-hidden">
          <button type="button" onClick={() => switchMode(true)} className={`w-1/2 text-lg font-medium transition-all z-10 ${isLoginMode ? "text-white" : glass ? "text-white/80" : "text-black"}`}>
            Login
          </button>
          <button type="button" onClick={() => switchMode(false)} className={`w-1/2 text-lg font-medium transition-all z-10 ${!isLoginMode ? "text-white" : glass ? "text-white/80" : "text-black"}`}>
            Sign Up
          </button>
          <div className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${isLoginMode ? "left-0" : "left-1/2"}`}> </div>
        </div>

        {!isLoginMode && (
          <p className={`text-sm mb-4 ${glass ? "text-white/80" : "text-gray-500"}`}>
            For parents only. Use the same email you gave the school at admission.
            Teachers and admins get their accounts from the school office.
          </p>
        )}

        {/* form section */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className={inputClass}
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email"
            required
            className={inputClass}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className={inputClass}
          />

          {!isLoginMode && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className={inputClass}
            />
          )}

          {isLoginMode && (
            <div className="text-right">
              <p className={`text-sm ${glass ? "text-white/80" : "text-gray-400"}`}>
                Forgot your password? Ask the school office to reset it.
              </p>
            </div>
          )}

          {error && <p className={`text-sm text-center ${glass ? "text-red-300" : "text-red-500"}`}>{error}</p>}
          {success && <p className={`text-sm text-center ${glass ? "text-green-300" : "text-green-600"}`}>{success}</p>}

          <button type="submit" className="w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg font-medium hover:opacity-90 transition">
            {isLoginMode ? "Login" : "Sign Up"}
          </button>

          <p className={`text-center ${glass ? "text-white/90" : "text-gray-600"}`}>
            {isLoginMode ? "Parent without an account? " : "Already have an account? "}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); switchMode(!isLoginMode) }}
              className={glass ? "text-cyan-200 hover:underline" : "text-cyan-600 hover:underline"}
            >
              {isLoginMode ? "Sign up now" : "Login"}
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default LoginFrom