import { Camera, Heart } from "lucide-react"

const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-6xl px-4 pb-8 sm:px-6">
      <div className="neumorphic-card flex flex-col items-center gap-3 rounded-3xl px-5 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#09251c] text-[#f8eadc]">
            <Camera className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-foreground">
              PiTech
            </p>
            <p className="text-xs text-muted-foreground">
              © {YEAR} PiTech · AllianCICS
            </p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          Made with
          <Heart className="h-3.5 w-3.5 fill-[#a55704] text-[#a55704]" />
          for your memories
        </p>
      </div>

      <p className="mt-4 text-center text-xs font-medium text-[#a55704]">
        Up to 5 photos can be stored per device.
      </p>
    </footer>
  )
}
