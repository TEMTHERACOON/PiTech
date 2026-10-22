/**
 * Authentication layer.
 *
 * Uses Supabase Auth when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are
 * configured, and otherwise falls back to a local mock so the app still runs
 * before a project is connected. The exported signatures are identical either
 * way, so the UI never changes.
 *
 * The mock keeps sessions in `localStorage` and auto-approves every sign-in.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export type User = {
  id: string
  email: string
  name: string
  provider: "password" | "google"
  createdAt: string
}

/** Outcome of a sign-up: either a live session, or a pending confirmation. */
export type SignUpResult = {
  user: User | null
  /** True when Supabase sent a confirmation email and no session exists yet. */
  needsEmailConfirmation?: boolean
}

// ---------------------------------------------------------------------------
// Supabase-backed implementation
// ---------------------------------------------------------------------------

function toUser(input: {
  id: string
  email?: string | null
  createdAt?: string
  appMetadata?: Record<string, unknown>
  userMetadata?: Record<string, unknown>
}): User {
  const email = input.email ?? ""
  const provider =
    (input.appMetadata?.provider as string) === "google" ? "google" : "password"
  const metaName = input.userMetadata?.full_name ?? input.userMetadata?.name

  return {
    id: input.id,
    email,
    name: (metaName as string) || displayName(email),
    provider,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

function displayName(email: string) {
  if (!email) return "PiTech user"
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Reads the current Supabase session, if any. */
export function getSession(): User | null {
  if (!isSupabaseConfigured) return getMockSession()
  // Supabase hydrates asynchronously; `AuthProvider` reads the live session in
  // its own effect. Returning null here keeps first paint consistent.
  return null
}

/** Hydrates the current user from Supabase (async). No-op in mock mode. */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return getMockSession()

  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return toUser({
    id: data.user.id,
    email: data.user.email,
    createdAt: data.user.created_at,
    appMetadata: data.user.app_metadata,
    userMetadata: data.user.user_metadata,
  })
}

/** Subscribes to auth changes so the UI follows sign-in / sign-out. */
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured || !supabase) return () => {}

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(
      session?.user
        ? toUser({
            id: session.user.id,
            email: session.user.email,
            createdAt: session.user.created_at,
            appMetadata: session.user.app_metadata,
            userMetadata: session.user.user_metadata,
          })
        : null,
    )
  })

  return () => data.subscription.unsubscribe()
}

/** Registers a new account. */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<SignUpResult> {
  if (!isSupabaseConfigured || !supabase) return { user: await mockSignUp(email, password) }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error("Sign-up did not return a user.")

  // With "Confirm email" enabled Supabase returns a user but no session — the
  // account is not usable until the emailed link is clicked. Report that state
  // instead of handing back a user the app cannot use.
  if (!data.session) return { user: null, needsEmailConfirmation: true }

  return {
    user: toUser({
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
      appMetadata: data.user.app_metadata,
      userMetadata: data.user.user_metadata,
    }),
  }
}

/** Signs in with email and password. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<User> {
  if (!isSupabaseConfigured || !supabase) return mockSignIn(email, password)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error("Sign-in did not return a user.")

  return toUser({
    id: data.user.id,
    email: data.user.email,
    createdAt: data.user.created_at,
    appMetadata: data.user.app_metadata,
    userMetadata: data.user.user_metadata,
  })
}

/** Starts Google OAuth. In mock mode this resolves immediately. */
export async function signInWithGoogle(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return mockSignInWithGoogle()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  })
  if (error) throw new Error(error.message)
  // The browser is redirected to Google; the session arrives on the way back.
  return null
}

export async function signOut() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
    return
  }
  persistMockSession(null)
}

// ---------------------------------------------------------------------------
// Local mock (fallback when Supabase is not configured)
// ---------------------------------------------------------------------------

const USERS_KEY = "pitech.users"
const SESSION_KEY = "pitech.session"

type StoredUser = User & { password?: string }

function readMockUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeMockUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function persistMockSession(user: StoredUser | null) {
  if (user) {
    const { password: _password, ...safe } = user
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function getMockSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

async function mockSignUp(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const users = readMockUsers()

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalized,
    name: displayName(normalized),
    provider: "password",
    createdAt: new Date().toISOString(),
    // Stored only so the mock can be inspected; never do this for real.
    password,
  }

  const existing = users.findIndex((u) => u.email === normalized)
  if (existing >= 0) users[existing] = user
  else users.push(user)

  writeMockUsers(users)
  persistMockSession(user)
  return getMockSession() as User
}

async function mockSignIn(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const users = readMockUsers()
  const found = users.find((u) => u.email === normalized)

  if (found) {
    found.password = password
    writeMockUsers(users)
    persistMockSession(found)
    return getMockSession() as User
  }

  return mockSignUp(email, password)
}

async function mockSignInWithGoogle(): Promise<User> {
  const users = readMockUsers()
  const email = "you@gmail.com"
  const found = users.find((u) => u.email === email)

  const user: StoredUser = found ?? {
    id: crypto.randomUUID(),
    email,
    name: "Google User",
    provider: "google",
    createdAt: new Date().toISOString(),
  }
  user.provider = "google"

  if (!found) users.push(user)
  writeMockUsers(users)
  persistMockSession(user)
  return getMockSession() as User
}
