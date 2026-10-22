import frameCutout from "@/assets/frame-cutout.png"

type PhotoFrameProps = {
  photo: string | null
  className?: string
}

export function PhotoFrame({ photo, className = "" }: PhotoFrameProps) {
  return (
    <div
      className={`neumorphic-frame relative aspect-square w-full overflow-hidden rounded-[2rem] border-[8px] border-[#f8eadc] bg-[#f3d2af] transition-all duration-300 ease-out hover:scale-[1.01] active:scale-[0.99] sm:rounded-[2.5rem] ${className}`}
    >
      {photo ? (
        <img
          src={photo}
          alt="Photo placed inside the frame"
          className="absolute inset-0 h-full w-full object-cover"
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
  )
}
