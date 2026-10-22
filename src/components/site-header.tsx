import { Camera } from "lucide-react"

export function SiteHeader({ className = "" }: { className?: string }) {
  return (
    <header
      className={`neumorphic-card flex w-full max-w-3xl items-center justify-between gap-4 rounded-3xl px-5 py-4 sm:px-8 sm:py-5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#09251c] text-[#f8eadc] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] sm:h-12 sm:w-12">
          <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="flex flex-col text-left leading-tight">
          <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            PiTech
          </span>
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">
            Frame your memories
          </span>
        </div>
      </div>

      <p className="text-right text-sm font-semibold tracking-tight text-[#a55704] sm:text-base">
        Memories Forever Digitlized!
      </p>
    </header>
  )
}
