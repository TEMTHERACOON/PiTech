import frameCutout from "@/assets/frame-cutout.png"

type PhotoFrameProps = {
  photo: string | null
  className?: string
}

export function PhotoFrame({ photo, className = "" }: PhotoFrameProps) {
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-3xl bg-white shadow-frame sm:rounded-4xl ${className}`}
    >
      {photo ? (
        <img
          src={photo}
          alt="Photo placed inside the frame"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="max-w-[70%] text-center text-sm font-medium text-muted-foreground">
            Upload a photo and it will be placed inside the frame.
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
  )
}
