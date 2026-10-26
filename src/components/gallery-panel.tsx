import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Loader2 } from "lucide-react"
import { Download3D, ImageOff3D, Trash3D } from "@/components/icons-3d"
import {
  deletePhoto,
  listPhotos,
  releasePhotos,
  type SavedPhoto,
} from "@/lib/gallery"

export function GalleryPanel() {
  const [photos, setPhotos] = useState<SavedPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const next = await listPhotos()
    setPhotos((current) => {
      releasePhotos(current)
      return next
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    refresh()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
      setPhotos((current) => {
        releasePhotos(current)
        return []
      })
    }
  }, [refresh])

  const handleDelete = async (id: string) => {
    try {
      await deletePhoto(id)
      setNotice("Photo deleted.")
      await refresh()
    } catch (error: unknown) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not delete the photo.",
      )
    }
  }

  const handleSaveToDevice = (photo: SavedPhoto) => {
    const url = URL.createObjectURL(photo.blob)
    const link = document.createElement("a")
    link.href = url
    link.download = photo.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Images
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            Synced with your Supabase account.
          </p>
        </div>
        <p className="text-sm font-semibold text-[#16794a]">
          {photos.length} saved photos
        </p>
      </div>

      <p className="neumorphic-card rounded-2xl px-4 py-3 text-center text-sm font-medium text-muted-foreground sm:text-left">
        Save as many framed photos as you need on this device.
      </p>

      <AnimatePresence>
        {notice && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="status"
            className="text-sm font-semibold text-[#16794a]"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading your photos…</span>
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="icon-3d flex h-16 w-16 items-center justify-center rounded-3xl text-white">
            <ImageOff3D size={30} />
          </span>
          <p className="text-sm font-medium text-muted-foreground">
            No saved photos yet. Capture a photo to save it here automatically.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {photos.map((photo) => (
              <motion.li
                layout
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="neumorphic-frame group relative overflow-hidden rounded-3xl p-2"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="aspect-square w-full rounded-2xl object-cover"
                />

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveToDevice(photo)}
                    aria-label={`Download ${photo.name}`}
                    className="neumorphic-button flex h-9 flex-1 cursor-pointer items-center justify-center rounded-xl"
                  >
                    <Download3D size={18} className="text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    aria-label={`Delete ${photo.name}`}
                    className="neumorphic-button flex h-9 flex-1 cursor-pointer items-center justify-center rounded-xl"
                  >
                    <Trash3D size={18} className="text-white" />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
