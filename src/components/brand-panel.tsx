import allianCics from "@/assets/Alliancics.png"

export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${className}`}>
      <p className="text-balance text-2xl font-bold tracking-tight text-foreground transition-all duration-200 ease-out hover:scale-[1.04] sm:text-3xl">
        Memories Forever Digitlized!
      </p>

      <img
        src={allianCics}
        alt="AllianCICS"
        className="h-16 w-auto select-none drop-shadow-[3px_3px_6px_#a55704] transition-all duration-200 ease-out hover:scale-[1.06] hover:drop-shadow-[5px_5px_10px_#a55704] active:scale-[1.06] sm:h-20"
      />
    </div>
  )
}
