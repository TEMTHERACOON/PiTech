import allianCics from "@/assets/Alliancics.png"
import pitech from "@/assets/PiTech.png"

export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-6 text-center ${className}`}>
      <img
        src={pitech}
        alt="PiTech"
        className="h-14 w-auto select-none sm:h-16"
      />

      <p className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Memories Forever Digitlized!
      </p>

      <img
        src={allianCics}
        alt="AllianCICS"
        className="h-20 w-auto select-none sm:h-24"
      />
    </div>
  )
}
