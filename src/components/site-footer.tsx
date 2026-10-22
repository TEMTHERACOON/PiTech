import { Heart } from "lucide-react"
import { Camera3D } from "@/components/icons-3d"

const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
      <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="icon-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Camera3D size={20} />
          </span>
          <p className="text-xs font-semibold tracking-tight text-foreground">
            PiTech
            <span className="ml-2 font-normal text-muted-foreground">
              © {YEAR} · Up to 5 photos per device
            </span>
          </p>
        </div>

        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          Made with
          <Heart className="h-3.5 w-3.5 fill-[#fcf1d0] text-[#fcf1d0]" />
          for your memories
        </p>
      </div>
    </div>
  )
}
