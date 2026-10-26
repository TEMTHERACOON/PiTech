import { useState } from "react"
import { motion } from "motion/react"
import { Download3D } from "@/components/icons-3d"
import { Button } from "@/components/ui/button"
import { composeFrame, downloadBlob } from "@/lib/compose-frame"
import type { PhotoTransform } from "@/lib/photo-transform"

const neumorphicButtonClasses =
  "neumorphic-button group relative flex h-14 w-full max-w-[280px] cursor-pointer items-center justify-center gap-3 rounded-2xl border-0 px-6 text-[#fcf1d0] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100"

type ActionButtonsProps = {
  photo: string | null
  fileName: string | null
  transform: PhotoTransform
  onExported?: (blob: Blob, name: string) => void
}

export function ActionButtons({
  photo,
  fileName,
  transform,
  onExported,
}: ActionButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!photo) return
    setError(null)
    setIsExporting(true)
    try {
      const blob = await composeFrame(photo, transform)
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

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full justify-center"
      >
        <Button
          type="button"
          variant="ghost"
          className={neumorphicButtonClasses}
          onClick={handleDownload}
          disabled={!photo || isExporting}
        >
          <Download3D size={22} className="text-white" />
          <span className="text-base font-medium">
            {isExporting ? "Preparing..." : "Download"}
          </span>
        </Button>
      </motion.div>
      <p role="status" className="min-h-5 text-sm font-medium text-muted-foreground">
        {error ?? (isExporting ? "Preparing your framed photo…" : "Ready to download")}
      </p>
    </div>
  )
}
