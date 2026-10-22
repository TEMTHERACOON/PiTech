import { useRef, useState } from "react"
import { Camera, Download, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { composeFrame, downloadBlob } from "@/lib/compose-frame"

const neumorphicButtonClasses =
  "neumorphic-button group relative flex h-14 w-full max-w-[280px] cursor-pointer items-center justify-center gap-3 rounded-2xl border-0 bg-background px-6 text-foreground transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100"

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
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onSelectPhoto(file)
    event.target.value = ""
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-5">
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="ghost"
        className={neumorphicButtonClasses}
        onClick={() => cameraInputRef.current?.click()}
      >
        <Camera className="h-5 w-5" />
        <span className="text-base font-medium">Take Photo</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        className={neumorphicButtonClasses}
        onClick={() => galleryInputRef.current?.click()}
      >
        <ImagePlus className="h-5 w-5" />
        <span className="text-base font-medium">Upload from Gallery</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        className={neumorphicButtonClasses}
        onClick={handleDownload}
        disabled={!photo || isExporting}
      >
        <Download className="h-5 w-5" />
        <span className="text-base font-medium">
          {isExporting ? "Preparing..." : "Download"}
        </span>
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
              : "Take a photo or upload to get started")}
      </p>
    </div>
  )
}
