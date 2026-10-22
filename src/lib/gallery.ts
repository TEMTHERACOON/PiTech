/**
 * Local, per-device photo gallery.
 *
 * Photos are stored as Blobs in IndexedDB (localStorage is far too small for
 * images). A device is allowed at most `MAX_PHOTOS_PER_DEVICE` saved photos —
 * the same limit that will apply once accounts move to Supabase.
 */

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

export async function listPhotos(): Promise<SavedPhoto[]> {
  const rows = await tx<StoredRow[]>("readonly", (store) => store.getAll())
  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSavedPhoto)
}

export async function countPhotos(): Promise<number> {
  return tx<number>("readonly", (store) => store.count())
}

export class GalleryLimitError extends Error {
  constructor() {
    super(`You can save up to ${MAX_PHOTOS_PER_DEVICE} photos on this device.`)
    this.name = "GalleryLimitError"
  }
}

export async function addPhoto(file: File | Blob, name: string): Promise<SavedPhoto> {
  const total = await countPhotos()
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

export async function deletePhoto(id: string): Promise<void> {
  await tx("readwrite", (store) => store.delete(id))
}

export function releasePhotos(photos: SavedPhoto[]) {
  for (const photo of photos) URL.revokeObjectURL(photo.url)
}
