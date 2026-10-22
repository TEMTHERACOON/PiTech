/**
 * Geometry for the photo inside the frame.
 *
 * The frame artwork (`src/assets/frame-cutout.png`) is a 1080 x 1080 square
 * with a rectangular opening cut out of it — that opening is the window the
 * photo shows through. Everything here is measured in *frame units*: one unit
 * is one side of that square, so the same numbers describe the on-screen
 * preview and the 1080 px export canvas.
 *
 * The window was measured from the artwork's alpha channel — the transparent
 * region spans x 60..1019 and y 342..1019 of the 1080 px square.
 */

export type PhotoTransform = {
  /** Multiplier on top of the "cover" fit. 1 == the photo exactly fills the frame. */
  zoom: number
  /** Pan offset in frame units (1 == a full frame width). */
  offsetX: number
  offsetY: number
}

/** Size of the drawn photo in frame units. */
export type PhotoFit = { width: number; height: number }

/** Position and size of the drawn photo in frame units. */
export type PhotoRect = { left: number; top: number; width: number; height: number }

/** The opening in the frame artwork, in frame units. */
export type PhotoWindow = {
  left: number
  top: number
  right: number
  bottom: number
}

const FRAME_ARTWORK_SIZE = 1080

/** The opening cut out of the frame artwork, measured from its alpha channel. */
export const PHOTO_WINDOW: PhotoWindow = {
  left: 60 / FRAME_ARTWORK_SIZE,
  top: 342 / FRAME_ARTWORK_SIZE,
  right: 1019 / FRAME_ARTWORK_SIZE,
  bottom: 1019 / FRAME_ARTWORK_SIZE,
}

export const IDENTITY_TRANSFORM: PhotoTransform = { zoom: 1, offsetX: 0, offsetY: 0 }

/** The photo can never be zoomed out past the fit — that would leave gaps. */
export const MIN_ZOOM = 1
export const MAX_ZOOM = 8

/** Multiplicative step used by the zoom buttons. */
export const ZOOM_STEP = 1.4

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * The "cover" fit: the smallest size at which the photo still covers the whole
 * frame square — the same as `object-fit: cover` on a square element.
 */
export function coverFit(naturalWidth: number, naturalHeight: number): PhotoFit {
  if (!naturalWidth || !naturalHeight) return { width: 1, height: 1 }
  const scale = Math.max(1 / naturalWidth, 1 / naturalHeight)
  return { width: naturalWidth * scale, height: naturalHeight * scale }
}

/** Where the photo is drawn, in frame units. */
export function photoRect(transform: PhotoTransform, fit: PhotoFit): PhotoRect {
  const width = fit.width * transform.zoom
  const height = fit.height * transform.zoom
  return {
    left: 0.5 + transform.offsetX - width / 2,
    top: 0.5 + transform.offsetY - height / 2,
    width,
    height,
  }
}

/** The inverse of {@link photoRect}. */
export function transformFromRect(rect: PhotoRect, fit: PhotoFit): PhotoTransform {
  return {
    zoom: fit.width ? rect.width / fit.width : 1,
    offsetX: rect.left + rect.width / 2 - 0.5,
    offsetY: rect.top + rect.height / 2 - 0.5,
  }
}

/**
 * Keeps the photo covering the whole window: it can never be dragged far
 * enough to leave a gap, and it can never be zoomed out past the fit.
 */
export function clampTransform(
  transform: PhotoTransform,
  fit: PhotoFit,
  win: PhotoWindow = PHOTO_WINDOW,
): PhotoTransform {
  const zoom = clamp(transform.zoom, MIN_ZOOM, MAX_ZOOM)
  const halfWidth = (fit.width * zoom) / 2
  const halfHeight = (fit.height * zoom) / 2

  return {
    zoom,
    offsetX: clamp(
      transform.offsetX,
      win.right - 0.5 - halfWidth,
      win.left - 0.5 + halfWidth,
    ),
    offsetY: clamp(
      transform.offsetY,
      win.bottom - 0.5 - halfHeight,
      win.top - 0.5 + halfHeight,
    ),
  }
}

/** Moves the photo by a delta expressed in frame units. */
export function panBy(
  transform: PhotoTransform,
  fit: PhotoFit,
  dx: number,
  dy: number,
  win: PhotoWindow = PHOTO_WINDOW,
): PhotoTransform {
  return clampTransform(
    { ...transform, offsetX: transform.offsetX + dx, offsetY: transform.offsetY + dy },
    fit,
    win,
  )
}

/**
 * Zooms to `nextZoom` around `anchor` (a point in frame coordinates), keeping
 * whatever sits under the anchor exactly where it is.
 */
export function zoomTo(
  transform: PhotoTransform,
  fit: PhotoFit,
  anchor: { x: number; y: number },
  nextZoom: number,
  win: PhotoWindow = PHOTO_WINDOW,
): PhotoTransform {
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
  const rect = photoRect(transform, fit)
  const contentX = (anchor.x - rect.left) / rect.width
  const contentY = (anchor.y - rect.top) / rect.height
  const width = rect.width * (zoom / transform.zoom)
  const height = rect.height * (zoom / transform.zoom)

  return clampTransform(
    transformFromRect(
      {
        left: anchor.x - contentX * width,
        top: anchor.y - contentY * height,
        width,
        height,
      },
      fit,
    ),
    fit,
    win,
  )
}

/** The zoom level as a percentage, for display. */
export function zoomPercent(transform: PhotoTransform): number {
  return Math.round(transform.zoom * 100)
}
