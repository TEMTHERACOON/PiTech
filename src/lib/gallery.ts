/**
 * Per-device photo gallery.
 *
 * Supabase Storage is the source of truth when configured. IndexedDB remains
 * as an offline fallback for local development without Supabase credentials.
 */

import {
  isSupabaseConfigured,
  PHOTOS_BUCKET,
  supabase,
} from "@/lib/supabase"

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

type SupabasePhotoRow = {
  id: string
  storage_path: string
  name: string
  created_at: string
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

async function idbAddPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
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

async function getSupabaseOwner(): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.")
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error("Your session has expired. Please sign in again.")
  return data.user.id
}

async function supabaseListPhotos(): Promise<SavedPhoto[]> {
  if (!supabase) throw new Error("Supabase is not configured.")
  const client = supabase
  const ownerId = await getSupabaseOwner()
  const { data, error } = await client
    .from("photo_slots")
    .select("id, storage_path, name, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Could not load photos: ${error.message}`)

  const rows = (data ?? []) as SupabasePhotoRow[]
  const photos = await Promise.all(
    rows.map(async (row) => {
      const { data: blob, error: downloadError } = await client.storage
        .from(PHOTOS_BUCKET)
        .download(row.storage_path)
      if (downloadError || !blob) {
        throw new Error(`Could not load ${row.name}: ${downloadError?.message ?? "missing file"}`)
      }
      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        blob,
        url: URL.createObjectURL(blob),
      }
    }),
  )
  return photos
}

async function supabaseAddPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
  if (!supabase) throw new Error("Supabase is not configured.")
  const ownerId = await getSupabaseOwner()
  const id = crypto.randomUUID()
  const storagePath = `${ownerId}/${id}.png`
  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(storagePath, file, { contentType: "image/png", upsert: false })
  if (uploadError) throw new Error(`Could not upload photo: ${uploadError.message}`)

  const { data, error: insertError } = await supabase
    .from("photo_slots")
    .insert({
      id,
      owner_id: ownerId,
      storage_path: storagePath,
      name,
    })
    .select("id, storage_path, name, created_at")
    .single()
  if (insertError || !data) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath])
    throw new Error(`Could not save photo metadata: ${insertError?.message ?? "unknown error"}`)
  }

  const row = data as SupabasePhotoRow
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    blob: file,
    url: URL.createObjectURL(file),
  }
}

async function supabaseDeletePhoto(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.")
  const ownerId = await getSupabaseOwner()
  const { data, error: lookupError } = await supabase
    .from("photo_slots")
    .select("storage_path")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .single()
  if (lookupError || !data) throw new Error(`Could not find photo: ${lookupError?.message ?? "unknown error"}`)

  const storagePath = (data as { storage_path: string }).storage_path
  const { error: removeError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .remove([storagePath])
  if (removeError) throw new Error(`Could not delete photo file: ${removeError.message}`)

  const { error: deleteError } = await supabase
    .from("photo_slots")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)
  if (deleteError) throw new Error(`Could not delete photo record: ${deleteError.message}`)
}

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
