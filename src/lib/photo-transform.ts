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
 *
 * The window is the pivot for everything: 100 % zoom means the photo exactly
 * covers the opening, zooming out shrinks it onto the white mat inside the
 * frame, and zooming in crops it (and lets you drag the crop around).
 */

export type PhotoTransform = {
  /** Multiplier on top of the "cover the window" fit. 1 == the photo fills the opening. */
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

/** The centre of the opening — the pivot for zoom and pan. */
export const WINDOW_CENTER = {
  x: (PHOTO_WINDOW.left + PHOTO_WINDOW.right) / 2,
  y: (PHOTO_WINDOW.top + PHOTO_WINDOW.bottom) / 2,
}

/** The size of the opening. */
export const WINDOW_SIZE = {
  width: PHOTO_WINDOW.right - PHOTO_WINDOW.left,
  height: PHOTO_WINDOW.bottom - PHOTO_WINDOW.top,
}

export const IDENTITY_TRANSFORM: PhotoTransform = { zoom: 1, offsetX: 0, offsetY: 0 }

/** Zoomed all the way out, the photo sits on the mat as a small print. */
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 8

/** Multiplicative step used by the zoom buttons. */
export const ZOOM_STEP = 1.4

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * The "cover" fit against the frame's window: the smallest size at which the
 * photo still covers the whole opening. At 100 % zoom the photo therefore
 * fills the frame, with no mat showing.
 */
export function coverFit(naturalWidth: number, naturalHeight: number): PhotoFit {
  if (!naturalWidth || !naturalHeight) {
    return { width: WINDOW_SIZE.width, height: WINDOW_SIZE.height }
  }
  const scale = Math.max(
    WINDOW_SIZE.width / naturalWidth,
    WINDOW_SIZE.height / naturalHeight,
  )
  return { width: naturalWidth * scale, height: naturalHeight * scale }
}

/** Where the photo is drawn, in frame units. */
export function photoRect(transform: PhotoTransform, fit: PhotoFit): PhotoRect {
  const width = fit.width * transform.zoom
  const height = fit.height * transform.zoom
  return {
    left: WINDOW_CENTER.x + transform.offsetX - width / 2,
    top: WINDOW_CENTER.y + transform.offsetY - height / 2,
    width,
    height,
  }
}

/** The inverse of {@link photoRect}. */
export function transformFromRect(rect: PhotoRect, fit: PhotoFit): PhotoTransform {
  return {
    zoom: fit.width ? rect.width / fit.width : 1,
    offsetX: rect.left + rect.width / 2 - WINDOW_CENTER.x,
    offsetY: rect.top + rect.height / 2 - WINDOW_CENTER.y,
  }
}

/**
 * Keeps the photo honest: it either covers the whole opening or sits inside
 * it — never half in, never half out. Zoomed in, that means it can never be
 * dragged off the opening; zoomed out, it can never be dragged out of it.
 */
export function clampTransform(
  transform: PhotoTransform,
  fit: PhotoFit,
): PhotoTransform {
  const zoom = clamp(transform.zoom, MIN_ZOOM, MAX_ZOOM)
  const width = fit.width * zoom
  const height = fit.height * zoom

  const limitX = Math.abs(width - WINDOW_SIZE.width) / 2
  const limitY = Math.abs(height - WINDOW_SIZE.height) / 2

  return {
    zoom,
    offsetX: clamp(transform.offsetX, -limitX, limitX),
    offsetY: clamp(transform.offsetY, -limitY, limitY),
  }
}

/** Moves the photo by a delta expressed in frame units. */
export function panBy(
  transform: PhotoTransform,
  fit: PhotoFit,
  dx: number,
  dy: number,
): PhotoTransform {
  return clampTransform(
    { ...transform, offsetX: transform.offsetX + dx, offsetY: transform.offsetY + dy },
    fit,
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
  )
}

/** The zoom level as a percentage, for display. */
export function zoomPercent(transform: PhotoTransform): number {
  return Math.round(transform.zoom * 100)
}
