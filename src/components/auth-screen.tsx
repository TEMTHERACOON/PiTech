import { useState } from "react"
import { motion } from "motion/react"
import { Camera, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

type Mode = "signin" | "signup"

const fieldClasses =
  "h-12 w-full rounded-2xl border-0 bg-[#fbf1e6] pl-11 pr-11 text-foreground shadow-[inset_3px_3px_7px_rgba(163,130,96,0.14),inset_-3px_-3px_7px_rgba(255,253,249,0.9)] outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:shadow-[inset_2px_2px_5px_rgba(163,130,96,0.12),inset_-2px_-2px_5px_rgba(255,253,249,0.9),0_0_0_2px_rgba(208,165,119,0.5)]"

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const isSignup = mode === "signup"

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !password || isBusy) return
    setIsBusy(true)
    try {
      if (isSignup) await signUp(email, password)
      else await signIn(email, password)
    } finally {
      setIsBusy(false)
    }
  }

  const handleGoogle = async () => {
    if (isBusy) return
    setIsBusy(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="neumorphic-card w-full max-w-md rounded-[2rem] p-7 sm:p-9"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.span
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2b443a] text-[#fbf1e6] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.2)]"
          >
            <Camera className="h-7 w-7" />
          </motion.span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Sign in to frame your photos.
          </p>
        </div>

        <div className="mt-7 flex rounded-2xl bg-[#fbf1e6] p-1 shadow-[inset_2px_2px_6px_rgba(163,130,96,0.14),inset_-2px_-2px_6px_rgba(255,253,249,0.9)]">
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className="relative flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              {mode === value && (
                <motion.span
                  layoutId="auth-tab"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="absolute inset-0 rounded-xl bg-[#2b443a] shadow-[2px_2px_6px_rgba(163,130,96,0.25)]"
                />
              )}
              <span
                className={`relative ${
                  mode === value ? "text-[#fbf1e6]" : "text-muted-foreground"
                }`}
              >
                {value === "signin" ? "Log in" : "Register"}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-left">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Email
            </span>
            <span className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#b07b45]" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldClasses}
              />
            </span>
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Password
            </span>
            <span className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#b07b45]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={fieldClasses}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <Button
            type="submit"
            disabled={isBusy}
            className="mt-1 h-12 w-full cursor-pointer rounded-2xl border-0 bg-[#b07b45] text-base font-semibold text-[#fbf1e6] shadow-[6px_6px_14px_rgba(163,130,96,0.22),-6px_-6px_14px_rgba(255,253,249,0.9)] transition-all hover:bg-[#b07b45]/92 hover:shadow-[3px_3px_8px_rgba(163,130,96,0.2),-3px_-3px_8px_rgba(255,253,249,0.85)] active:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.2)] disabled:pointer-events-none disabled:opacity-60"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Please wait…
              </>
            ) : (
              <>{isSignup ? "Create account" : "Log in"}</>
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#f0dcbf]" />
          <span className="text-xs font-medium text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-[#f0dcbf]" />
        </div>

        <Button
          type="button"
          onClick={handleGoogle}
          disabled={isBusy}
          className="mt-6 h-12 w-full cursor-pointer rounded-2xl border-0 bg-background text-base font-semibold text-foreground shadow-[6px_6px_14px_rgba(163,130,96,0.18),-6px_-6px_14px_rgba(255,253,249,0.9)] transition-all hover:shadow-[3px_3px_8px_rgba(163,130,96,0.16),-3px_-3px_8px_rgba(255,253,249,0.85)] hover:scale-[1.01] active:shadow-[inset_4px_4px_9px_rgba(163,130,96,0.2),inset_-4px_-4px_9px_rgba(255,253,249,0.85)] disabled:pointer-events-none disabled:opacity-60"
        >
          <GoogleMark />
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Demo mode — every sign-up and sign-in is auto-approved. Supabase auth
          is coming soon.
        </p>
      </motion.div>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.55-5.17 3.55-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}
