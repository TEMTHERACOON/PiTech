import { useRef, useState } from "react"
import { motion } from "motion/react"
import { Download3D, Camera3D, ImagePlus3D } from "@/components/icons-3d"
import { Button } from "@/components/ui/button"
import { composeFrame, downloadBlob } from "@/lib/compose-frame"

const neumorphicButtonClasses =
  "neumorphic-button group relative flex h-14 w-full max-w-[280px] cursor-pointer items-center justify-center gap-3 rounded-2xl border-0 px-6 text-foreground transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100"

type ActionButtonsProps = {
  photo: string | null
  fileName: string | null
  onSelectPhoto: (file: File) => void
  /** Reports the framed export so the caller can offer saving it to the gallery. */
  onExported?: (blob: Blob, name: string) => void
}

export function ActionButtons({
  photo,
  fileName,
  onSelectPhoto,
  onExported,
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
      const exportName = `pitech-${base}-framed.png`
      downloadBlob(blob, exportName)
      onExported?.(blob, exportName)
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

  const handleCamera = () => cameraInputRef.current?.click()
  const handleGallery = () => galleryInputRef.current?.click()

  const buttons = [
    {
      key: "camera",
      Icon: Camera3D,
      label: "Take Photo",
      onClick: handleCamera,
      disabled: false,
    },
    {
      key: "gallery",
      Icon: ImagePlus3D,
      label: "Upload from Gallery",
      onClick: handleGallery,
      disabled: false,
    },
    {
      key: "download",
      Icon: Download3D,
      label: isExporting ? "Preparing..." : "Download",
      onClick: handleDownload,
      disabled: !photo || isExporting,
    },
  ]

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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        className="flex w-full flex-col items-center gap-4 sm:gap-5"
      >
        {buttons.map(({ key, Icon, label, onClick, disabled }) => (
          <motion.div
            key={key}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex w-full justify-center"
          >
            <Button
              type="button"
              variant="ghost"
              className={neumorphicButtonClasses}
              onClick={onClick}
              disabled={disabled}
            >
              <span className="icon-3d flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Icon size={22} />
              </span>
              <span className="text-base font-medium">{label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

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
