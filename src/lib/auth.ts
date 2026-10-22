/**
 * Mock authentication layer.
 *
 * This intentionally mimics the shape of a real auth client (Supabase today is
 * the target) so the UI never has to change when the backend lands. Every
 * sign-up / sign-in is auto-approved: the user object is persisted in
 * `localStorage` and treated as a valid session.
 *
 * To move to Supabase later, replace the bodies of these functions with calls
 * to `supabase.auth.*` and keep the exported signatures identical.
 */

export type User = {
  id: string
  email: string
  name: string
  provider: "password" | "google"
  createdAt: string
}

const USERS_KEY = "pitech.users"
const SESSION_KEY = "pitech.session"

type StoredUser = User & { password?: string }

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function persistSession(user: StoredUser | null) {
  if (user) {
    const { password: _password, ...safe } = user
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function displayName(email: string) {
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

/** Registers a new account. Auto-approved — no email confirmation step. */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const users = readUsers()

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

  writeUsers(users)
  persistSession(user)
  return getSession() as User
}

/**
 * Signs in. In the mock every credential is accepted and auto-approved; if the
 * email is unknown an account is created on the fly so the demo never blocks.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const users = readUsers()
  const found = users.find((u) => u.email === normalized)

  if (found) {
    found.password = password
    writeUsers(users)
    persistSession(found)
    return getSession() as User
  }

  return signUpWithPassword(email, password)
}

/** Simulated Google OAuth. Always resolves to an approved session. */
export async function signInWithGoogle(): Promise<User> {
  const users = readUsers()
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
  writeUsers(users)
  persistSession(user)
  return getSession() as User
}

export function signOut() {
  persistSession(null)
}
