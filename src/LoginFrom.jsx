import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { useBranding } from "./BrandingContext"
import { parentSignup } from "./Accounts"

// How many seconds each background picture stays before the next one fades in
const SECONDS_PER_PICTURE = 2
// Password box with an eye button that shows or hides the password
function PasswordInput({ value, onChange, placeholder, className, glass }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        autoCapitalize="none"
        autoCorrect="off"
        className={`${className} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 ${
          glass ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {show ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}
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

  // Light box that holds the Login | Sign Up switch
  const tabBoxClass = glass
    ? "flex mb-6 p-1 rounded-xl bg-white/20 border border-white/40"
    : "flex mb-6 p-1 rounded-xl bg-gray-100 border border-gray-200"

  // One side of the switch: selected = light raised tile, not selected = plain text
  function tabClass(active) {
    const base = "w-1/2 py-2 text-lg font-medium rounded-lg transition-all"
    if (glass) {
      return `${base} ${active ? "bg-white/90 text-gray-800 shadow" : "text-white hover:bg-white/10"}`
    }
    return `${base} ${active ? "bg-white text-gray-800 shadow" : "text-gray-500 hover:text-gray-700"}`
  }

  // The big Login / Sign Up button at the bottom (light box, no color)
  const submitClass = glass
    ? "w-full p-3 rounded-xl text-lg font-medium bg-white/80 text-gray-800 border border-white/60 hover:bg-white transition"
    : "w-full p-3 rounded-xl text-lg font-medium bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 transition"

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
        await parentSignup({ name, email: email.trim(), password })
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
        body: JSON.stringify({ email: email.trim(), password }),
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
          className={`relative mb-6 text-3xl sm:text-5xl font-bold text-center ${
            glass ? "text-white drop-shadow-lg" : "text-[#30497D]"
          }`}
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

        {/* Login | Sign Up switch, inside a light box */}
        <div className={tabBoxClass}>
          <button type="button" onClick={() => switchMode(true)} className={tabClass(isLoginMode)}>
            Login
          </button>
          <button type="button" onClick={() => switchMode(false)} className={tabClass(!isLoginMode)}>
            Sign Up
          </button>
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
          />

                   <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={inputClass}
            glass={glass}
          />

          {!isLoginMode && (
                       <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={inputClass}
              glass={glass}
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

          <button type="submit" className={submitClass}>
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