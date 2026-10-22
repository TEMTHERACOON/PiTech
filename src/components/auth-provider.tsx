import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import * as auth from "@/lib/auth"
import type { User } from "@/lib/auth"

type AuthContextValue = {
  user: User | null
  /** True until the stored session has been read on first mount. */
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => auth.getSession())
  // Session hydration from localStorage is synchronous, so there is never a
  // loading window. Kept in the context shape for parity with Supabase later.
  const isLoading = false

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await auth.signInWithPassword(email, password))
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setUser(await auth.signUpWithPassword(email, password))
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setUser(await auth.signInWithGoogle())
  }, [])

  const signOut = useCallback(() => {
    auth.signOut()
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
