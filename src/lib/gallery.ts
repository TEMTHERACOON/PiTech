/**
 * Per-device photo gallery.
 *
 * When Supabase is configured, photos live in the private `photos` storage
 * bucket and metadata rows are kept in `public.photo_slots`. The 5-per-device
 * limit is enforced in that table by a trigger, so it cannot be bypassed by the
 * client — see `supabase/migrations`.
 *
 * Without Supabase the same API is served from IndexedDB (localStorage is far
 * too small for images), so the app works offline and before a project is
 * connected. `MAX_PHOTOS_PER_DEVICE` is the single source of truth for both.
 */

import { supabase, isSupabaseConfigured, PHOTOS_BUCKET } from "@/lib/supabase"

export const MAX_PHOTOS_PER_DEVICE = 5

const DB_NAME = "pitech"
const DB_VERSION = 1
const STORE = "photos"

export type SavedPhoto = {
  id: string
  name: string
  createdAt: string
  blob: Blob
  /** Object URL for rendering; revoked by the caller when done. */
  url: string
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export class GalleryLimitError extends Error {
  constructor() {
    super(`You can save up to ${MAX_PHOTOS_PER_DEVICE} photos on this device.`)
    this.name = "GalleryLimitError"
  }
}

/** Stable per-device id, used as the storage folder when nobody is signed in. */
function deviceId(): string {
  const KEY = "pitech.deviceId"
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

/** Storage folder owner: the signed-in user, else this device. */
async function ownerId(): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getUser()
    if (data.user) return data.user.id
  }
  return deviceId()
}

// ---------------------------------------------------------------------------
// Supabase-backed implementation
// ---------------------------------------------------------------------------

async function supabaseListPhotos(): Promise<SavedPhoto[]> {
  const client = supabase
  if (!client) return []
  const owner = await ownerId()

  const { data, error } = await client
    .from("photo_slots")
    .select("id, name, created_at, storage_path")
    .eq("owner_id", owner)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const photos = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: blob, error: downloadError } = await client.storage
        .from(PHOTOS_BUCKET)
        .download(row.storage_path)

      if (downloadError || !blob) throw new Error(downloadError?.message ?? "Download failed")
      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        blob,
        url: URL.createObjectURL(blob),
      } satisfies SavedPhoto
    }),
  )

  return photos
}

async function supabaseAddPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
  const client = supabase
  if (!client) throw new Error("Supabase is not configured.")

  const owner = await ownerId()
  const { count, error: countError } = await client
    .from("photo_slots")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", owner)

  if (countError) throw new Error(countError.message)
  if ((count ?? 0) >= MAX_PHOTOS_PER_DEVICE) throw new GalleryLimitError()

  const id = crypto.randomUUID()
  const extension = name.includes(".") ? name.split(".").pop() : "png"
  const storagePath = `${owner}/${id}.${extension}`

  const { error: uploadError } = await client.storage
    .from(PHOTOS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "image/png",
      upsert: false,
    })
  if (uploadError) throw new Error(uploadError.message)

  const { data: row, error: insertError } = await client
    .from("photo_slots")
    .insert({ id, owner_id: owner, storage_path: storagePath, name })
    .select("id, name, created_at")
    .single()

  if (insertError) {
    // Roll back the orphaned object if the row was rejected (e.g. limit hit).
    await client.storage.from(PHOTOS_BUCKET).remove([storagePath])
    if (insertError.code === "23514" || /up to 5 photos/i.test(insertError.message)) {
      throw new GalleryLimitError()
    }
    throw new Error(insertError.message)
  }

  const blob = file instanceof Blob ? file : new Blob([file])
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    blob,
    url: URL.createObjectURL(blob),
  }
}

async function supabaseDeletePhoto(id: string): Promise<void> {
  const client = supabase
  if (!client) return

  const { data } = await client
    .from("photo_slots")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle()

  const { error } = await client.from("photo_slots").delete().eq("id", id)
  if (error) throw new Error(error.message)

  if (data?.storage_path) {
    await client.storage.from(PHOTOS_BUCKET).remove([data.storage_path])
  }
}

// ---------------------------------------------------------------------------
// IndexedDB implementation (offline / unconfigured fallback)
// ---------------------------------------------------------------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

type StoredRow = {
  id: string
  name: string
  createdAt: string
  blob: Blob
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = run(transaction.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        transaction.oncomplete = () => db.close()
      }),
  )
}

function toSavedPhoto(row: StoredRow): SavedPhoto {
  return { ...row, url: URL.createObjectURL(row.blob) }
}

async function idbListPhotos(): Promise<SavedPhoto[]> {
  const rows = await tx<StoredRow[]>("readonly", (store) => store.getAll())
  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSavedPhoto)
}

async function idbCountPhotos(): Promise<number> {
  return tx<number>("readonly", (store) => store.count())
}

async function idbAddPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
  const total = await idbCountPhotos()
  if (total >= MAX_PHOTOS_PER_DEVICE) throw new GalleryLimitError()

  const row: StoredRow = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    blob: file,
  }
  await tx("readwrite", (store) => store.put(row))
  return toSavedPhoto(row)
}

async function idbDeletePhoto(id: string): Promise<void> {
  await tx("readwrite", (store) => store.delete(id))
}

// ---------------------------------------------------------------------------
// Public API — one interface, two backends
// ---------------------------------------------------------------------------

export async function listPhotos(): Promise<SavedPhoto[]> {
  return isSupabaseConfigured ? supabaseListPhotos() : idbListPhotos()
}

export async function addPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
  return isSupabaseConfigured ? supabaseAddPhoto(file, name) : idbAddPhoto(file, name)
}

export async function deletePhoto(id: string): Promise<void> {
  return isSupabaseConfigured ? supabaseDeletePhoto(id) : idbDeletePhoto(id)
}

export function releasePhotos(photos: SavedPhoto[]) {
  for (const photo of photos) URL.revokeObjectURL(photo.url)
}
