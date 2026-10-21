import frameCutout from "@/assets/frame-cutout.png"

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
 * Draws the photo (cover-fitted) on a 1080x1080 canvas and stamps the frame on
 * top of it. The frame asset is a cut-out: the photo window is transparent, so
 * the photo shows through exactly where the frame is open.
 */
export async function composeFrame(photoSrc: string): Promise<Blob> {
  const [photo, frame] = await Promise.all([
    loadImage(photoSrc),
    loadImage(frameCutout),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = FRAME_SIZE
  canvas.height = FRAME_SIZE

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context is not available")

  // object-fit: cover + object-position: center (matches the on-screen preview)
  const scale = Math.max(FRAME_SIZE / photo.width, FRAME_SIZE / photo.height)
  const drawWidth = photo.width * scale
  const drawHeight = photo.height * scale

  ctx.drawImage(
    photo,
    (FRAME_SIZE - drawWidth) / 2,
    (FRAME_SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight,
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
