import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import * as auth from "@/lib/auth"
import type { User } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase"

type AuthContextValue = {
  user: User | null
  /** True until the stored session has been read on first mount. */
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => auth.getSession())
  // With Supabase the session hydrates asynchronously; with the mock it is
  // synchronous from localStorage, so there is no loading window.
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  // Hydrate the Supabase session on mount and follow later auth changes.
  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    auth.getCurrentUser().then((current) => {
      if (!active) return
      setUser(current)
      setIsLoading(false)
    })

    const unsubscribe = auth.onAuthStateChange((next) => {
      setUser(next)
      setIsLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await auth.signInWithPassword(email, password))
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setUser(await auth.signUpWithPassword(email, password))
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const next = await auth.signInWithGoogle()
    // Supabase redirects the browser; only the mock resolves a user here.
    if (next) setUser(next)
  }, [])

  const signOut = useCallback(async () => {
    await auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signInWithGoogle, signOut }),
    [user, isLoading, signIn, signUp, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside an AuthProvider")
  return context
}
