/**
 * Per-device photo gallery.
 *
 * Photos live in IndexedDB so the shared PIN gate remains independent of any
 * user account or backend authentication.
 */

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

export async function listPhotos(): Promise<SavedPhoto[]> {
  return idbListPhotos()
}

export async function addPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
  return idbAddPhoto(file, name)
}

export async function deletePhoto(id: string): Promise<void> {
  return idbDeletePhoto(id)
}

export function releasePhotos(photos: SavedPhoto[]) {
  for (const photo of photos) URL.revokeObjectURL(photo.url)
}
