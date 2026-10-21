import { useRef, useState } from "react"
import downloadIcon from "@/assets/download.png"
import uploadIcon from "@/assets/uploud.png"
import { Button } from "@/components/ui/button"
import { composeFrame, downloadBlob } from "@/lib/compose-frame"

const imageButtonClasses =
  "h-auto w-full max-w-[240px] cursor-pointer rounded-2xl border-0 bg-transparent p-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-transparent active:translate-y-0 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0"

type ActionButtonsProps = {
  photo: string | null
  fileName: string | null
  onSelectPhoto: (file: File) => void
}

export function ActionButtons({
  photo,
  fileName,
  onSelectPhoto,
}: ActionButtonsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!photo) return
    setError(null)
    setIsExporting(true)
    try {
      const blob = await composeFrame(photo)
      const base = (fileName ?? "photo").replace(/\.[^.]+$/, "")
      downloadBlob(blob, `pitech-${base}-framed.png`)
    } catch {
      setError("Could not export the framed photo. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 lg:items-end">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onSelectPhoto(file)
          event.target.value = ""
        }}
      />

      <Button
        type="button"
        variant="ghost"
        className={imageButtonClasses}
        onClick={handleDownload}
        disabled={!photo || isExporting}
      >
        <img
          src={downloadIcon}
          alt={isExporting ? "Preparing download" : "Download framed photo"}
          className="drop-shadow-brand w-full select-none"
        />
      </Button>

      <Button
        type="button"
        variant="ghost"
        className={imageButtonClasses}
        onClick={() => inputRef.current?.click()}
      >
        <img
          src={uploadIcon}
          alt="Upload photo"
          className="drop-shadow-brand w-full select-none"
        />
      </Button>

      <p
        role="status"
        className="min-h-5 text-sm font-medium text-muted-foreground"
      >
        {error ??
          (isExporting
            ? "Preparing your framed photo…"
            : photo
              ? "Ready to download"
              : "Upload a photo to get started")}
      </p>
    </div>
  )
}
