import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import frameCutout from "@/assets/frame-cutout.png"
import { Reset3D, ZoomIn3D, ZoomOut3D } from "@/components/icons-3d"
import {
  IDENTITY_TRANSFORM,
  MAX_ZOOM,
  MIN_ZOOM,
  WINDOW_CENTER,
  ZOOM_STEP,
  clampTransform,
  coverFit,
  panBy,
  photoRect,
  zoomPercent,
  zoomTo,
  type PhotoTransform,
} from "@/lib/photo-transform"

type PhotoFrameProps = {
  photo: string | null
  /** Current zoom/pan of the photo inside the frame. */
  transform: PhotoTransform
  onTransformChange: (transform: PhotoTransform) => void
  className?: string
}

type PanGesture = {
  kind: "pan"
  lastX: number
  lastY: number
}

type PinchGesture = {
  kind: "pinch"
  startDistance: number
  startTransform: PhotoTransform
  /** Midpoint of the two fingers, in client coordinates. */
  startMid: { x: number; y: number }
}

type Gesture = PanGesture | PinchGesture

type NaturalSize = { src: string; width: number; height: number }

export function PhotoFrame({
  photo,
  transform,
  onTransformChange,
  className = "",
}: PhotoFrameProps) {
  const [natural, setNatural] = useState<NaturalSize | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef(transform)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const gestureRef = useRef<Gesture | null>(null)

  // Keep a mirror of the transform so a fast drag never reads a stale value.
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  const fit = useMemo(() => {
    // Only trust the measured size when it belongs to the photo on screen.
    const size = natural && natural.src === photo ? natural : null
    return coverFit(size?.width ?? 0, size?.height ?? 0)
  }, [natural, photo])
  const hasSize = Boolean(photo) && natural?.src === photo
  const rect = photoRect(clampTransform(transform, fit), fit)

  const applyTransform = useCallback(
    (next: PhotoTransform) => {
      transformRef.current = next
      onTransformChange(next)
    },
    [onTransformChange],
  )

  /** The photo area in client coordinates — the frame square, without its border. */
  const surfaceBox = useCallback(() => {
    const surface = surfaceRef.current
    if (!surface) return null
    const bounds = surface.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return null
    return { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }
  }, [])

  // ---------------------------------------------------------------------
  // Pointer: drag to move, two fingers to pinch-zoom
  // ---------------------------------------------------------------------

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!photo) return
    const surface = surfaceRef.current
    if (!surface) return

    surface.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 1) {
      gestureRef.current = { kind: "pan", lastX: event.clientX, lastY: event.clientY }
      setIsDragging(true)
      return
    }

    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()]
      gestureRef.current = {
        kind: "pinch",
        startDistance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        startTransform: transformRef.current,
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      }
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture || !pointersRef.current.has(event.pointerId)) return

    const box = surfaceBox()
    if (!box) return

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (gesture.kind === "pan") {
      if (pointersRef.current.size !== 1) return
      const dx = (event.clientX - gesture.lastX) / box.width
      const dy = (event.clientY - gesture.lastY) / box.height
      gesture.lastX = event.clientX
      gesture.lastY = event.clientY
      applyTransform(panBy(transformRef.current, fit, dx, dy))
      return
    }

    if (pointersRef.current.size < 2) return
    const [a, b] = [...pointersRef.current.values()]
    const distance = Math.hypot(a.x - b.x, a.y - b.y)
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

    const startMid = {
      x: (gesture.startMid.x - box.left) / box.width,
      y: (gesture.startMid.y - box.top) / box.height,
    }
    const currentMid = {
      x: (mid.x - box.left) / box.width,
      y: (mid.y - box.top) / box.height,
    }

    // Zoom around the fingers, then follow them as they move.
    const zoomed = zoomTo(
      gesture.startTransform,
      fit,
      startMid,
      gesture.startTransform.zoom * (distance / gesture.startDistance),
    )
    applyTransform(
      panBy(zoomed, fit, currentMid.x - startMid.x, currentMid.y - startMid.y),
    )
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.delete(event.pointerId)

    const surface = surfaceRef.current
    if (surface?.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId)
    }

    if (pointersRef.current.size === 0) {
      gestureRef.current = null
      setIsDragging(false)
      return
    }

    // One finger left — keep dragging with it.
    if (pointersRef.current.size === 1) {
      const [remaining] = [...pointersRef.current.values()]
      gestureRef.current = { kind: "pan", lastX: remaining.x, lastY: remaining.y }
    }
  }

  // ---------------------------------------------------------------------
  // Wheel / trackpad: zoom around the pointer
  // ---------------------------------------------------------------------

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || !photo) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      const box = surfaceBox()
      if (!box) return

      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? box.height : 1
      const factor = Math.exp((-event.deltaY * unit) / 400)
      const current = transformRef.current
      const anchor = {
        x: (event.clientX - box.left) / box.width,
        y: (event.clientY - box.top) / box.height,
      }

      applyTransform(zoomTo(current, fit, anchor, current.zoom * factor))
    }

    surface.addEventListener("wheel", handleWheel, { passive: false })
    return () => surface.removeEventListener("wheel", handleWheel)
  }, [photo, fit, applyTransform, surfaceBox])

  // ---------------------------------------------------------------------
  // Double click / double tap: back to the default fit
  // ---------------------------------------------------------------------

  const handleDoubleClick = () => {
    if (!photo) return
    applyTransform(clampTransform(IDENTITY_TRANSFORM, fit))
  }

  // ---------------------------------------------------------------------
  // Keyboard: arrows move, +/- zoom, 0 resets
  // ---------------------------------------------------------------------

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!photo) return
    const current = transformRef.current
    const step = event.shiftKey ? 0.1 : 0.02

    switch (event.key) {
      case "ArrowLeft":
        applyTransform(panBy(current, fit, -step, 0))
        break
      case "ArrowRight":
        applyTransform(panBy(current, fit, step, 0))
        break
      case "ArrowUp":
        applyTransform(panBy(current, fit, 0, -step))
        break
      case "ArrowDown":
        applyTransform(panBy(current, fit, 0, step))
        break
      case "+":
      case "=":
        applyTransform(
          zoomTo(current, fit, WINDOW_CENTER, current.zoom * ZOOM_STEP),
        )
        break
      case "-":
      case "_":
        applyTransform(
          zoomTo(current, fit, WINDOW_CENTER, current.zoom / ZOOM_STEP),
        )
        break
      case "0":
        applyTransform(clampTransform(IDENTITY_TRANSFORM, fit))
        break
      default:
        return
    }
    event.preventDefault()
  }

  const handleZoomIn = () => {
    const current = transformRef.current
    applyTransform(
      zoomTo(
        current,
        fit,
        WINDOW_CENTER,
        Math.min(MAX_ZOOM, current.zoom * ZOOM_STEP),
      ),
    )
  }

  const handleZoomOut = () => {
    const current = transformRef.current
    applyTransform(
      zoomTo(
        current,
        fit,
        WINDOW_CENTER,
        Math.max(MIN_ZOOM, current.zoom / ZOOM_STEP),
      ),
    )
  }

  const handleReset = () => {
    applyTransform(clampTransform(IDENTITY_TRANSFORM, fit))
  }

  const imageStyle: CSSProperties = hasSize
    ? {
        left: `${rect.left * 100}%`,
        top: `${rect.top * 100}%`,
        width: `${rect.width * 100}%`,
        height: `${rect.height * 100}%`,
      }
    : { inset: 0, width: "100%", height: "100%", objectFit: "cover" }

  return (
    <div className={`flex w-full flex-col items-center gap-3 ${className}`}>
      <div className="neumorphic-frame relative aspect-square w-full overflow-hidden rounded-[2rem] border-[8px] border-[#0b3a20] transition-shadow duration-300 ease-out sm:rounded-[2.5rem]">
        <div
          ref={surfaceRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          tabIndex={photo ? 0 : -1}
          role="group"
          aria-label="Photo inside the frame. Drag to move it, scroll or pinch to zoom."
          className={`absolute inset-0 touch-none select-none overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-[#16794a]/60 ${
            photo ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
          }`}
        >
          {photo ? (
            <img
              src={photo}
              alt="Photo placed inside the frame"
              draggable={false}
              onLoad={(event) => {
                const image = event.currentTarget
                setNatural({
                  src: photo,
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                })
              }}
              className="pointer-events-none absolute max-w-none select-none"
              style={imageStyle}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <p className="max-w-[70%] text-center text-sm font-medium text-muted-foreground sm:text-base">
                Take or upload a photo to place it inside the frame
              </p>
            </div>
          )}

          {/* The frame sits on top of the photo and is transparent inside the window. */}
          <img
            src={frameCutout}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
          />
        </div>
      </div>

      {photo && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#d3e8da] bg-white p-1.5 shadow-[0_10px_22px_-14px_rgba(20,102,58,0.35)]">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={transform.zoom <= MIN_ZOOM + 0.001}
              aria-label="Zoom out"
              className="neumorphic-button flex h-9 w-9 cursor-pointer items-center justify-center rounded-full disabled:pointer-events-none disabled:opacity-40"
            >
              <ZoomOut3D size={16} className="text-white" />
            </button>
            <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-[#0b3a20]">
              {zoomPercent(transform)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={transform.zoom >= MAX_ZOOM - 0.001}
              aria-label="Zoom in"
              className="neumorphic-button flex h-9 w-9 cursor-pointer items-center justify-center rounded-full disabled:pointer-events-none disabled:opacity-40"
            >
              <ZoomIn3D size={16} className="text-white" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset zoom and position"
              className="neumorphic-button flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
            >
              <Reset3D size={16} className="text-white" />
            </button>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Drag to reposition · Scroll or pinch to zoom · Double tap to reset
          </p>
        </div>
      )}
    </div>
  )
}
