import frameCutout from "@/assets/frame-cutout.png"
import {
  IDENTITY_TRANSFORM,
  clampTransform,
  coverFit,
  photoRect,
  type PhotoTransform,
} from "@/lib/photo-transform"

const FRAME_SIZE = 1080

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load image: ${src}`))
    img.src = src
  })
}

/**
 * Draws the photo on a 1080x1080 canvas and stamps the frame on top of it.
 * The frame asset is a cut-out: the photo window is transparent, so the photo
 * shows through exactly where the frame is open.
 *
 * The photo is placed with the same geometry as the on-screen preview — the
 * "cover" fit, plus the zoom and pan the user applied — so the export matches
 * what is in the frame, pixel for pixel.
 */
export async function composeFrame(
  photoSrc: string,
  transform: PhotoTransform = IDENTITY_TRANSFORM,
): Promise<Blob> {
  const [photo, frame] = await Promise.all([
    loadImage(photoSrc),
    loadImage(frameCutout),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = FRAME_SIZE
  canvas.height = FRAME_SIZE

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context is not available")

  const fit = coverFit(photo.naturalWidth, photo.naturalHeight)
  const rect = photoRect(clampTransform(transform, fit), fit)

  ctx.drawImage(
    photo,
    rect.left * FRAME_SIZE,
    rect.top * FRAME_SIZE,
    rect.width * FRAME_SIZE,
    rect.height * FRAME_SIZE,
  )
  ctx.drawImage(frame, 0, 0, FRAME_SIZE, FRAME_SIZE)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Could not export the framed photo"))
    }, "image/png")
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
