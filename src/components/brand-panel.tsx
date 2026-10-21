import allianCics from "@/assets/Alliancics.png"
import pitech from "@/assets/PiTech.png"

export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-center ${className}`}>
      <img
        src={pitech}
        alt="PiTech"
        className="h-30 w-auto max-w-full select-none object-contain sm:h-34"
      />

      <p className="text-balance text-lg tracking-tight text-foreground sm:text-xl">
        Memories Forever Digitlized!
      </p>

      <img
        src={allianCics}
        alt="AllianCICS"
        className="h-16 w-auto select-none sm:h-18"
      />
    </div>
  )
}
