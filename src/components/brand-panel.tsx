import allianCics from "@/assets/Alliancics.png"
import pitech from "@/assets/PiTech.png"

export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-6 text-center ${className}`}>
      <img
        src={pitech}
        alt="PiTech"
        className="h-20 w-auto select-none sm:h-24"
      />

      <p className="text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        Memories Forever Digitlized!
      </p>

      <img
        src={allianCics}
        alt="AllianCICS"
        className="h-14 w-auto select-none sm:h-16"
      />
    </div>
  )
}
