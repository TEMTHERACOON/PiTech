import allianCics from "@/assets/Alliancics.png"
import pitech from "@/assets/PiTech.png"

export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
      <img
        src={pitech}
        alt="PiTech"
        className="h-28 w-auto max-w-full select-none object-contain drop-shadow-[4px_4px_8px_#a9b5df] transition-all duration-200 ease-out hover:scale-[1.04] hover:drop-shadow-[6px_6px_12px_#a9b5df] active:scale-[1.04] sm:h-32"
      />

      <p className="text-balance text-lg font-medium tracking-tight text-foreground drop-shadow-[2px_2px_4px_rgba(169,181,223,0.4)] transition-all duration-200 ease-out hover:scale-[1.04] sm:text-xl">
        Memories Forever Digitlized!
      </p>

      <img
        src={allianCics}
        alt="AllianCICS"
        className="h-14 w-auto select-none drop-shadow-[3px_3px_6px_#a9b5df] transition-all duration-200 ease-out hover:scale-[1.06] hover:drop-shadow-[5px_5px_10px_#a9b5df] active:scale-[1.06] sm:h-16"
      />
    </div>
  )
}
