import { motion } from "motion/react"
import { Camera, Image, LogOut, Wand2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export type Tab = "create" | "images"

const TABS: { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: "create", label: "Create", icon: Wand2 },
  { id: "images", label: "My Images", icon: Image },
]

type SiteHeaderProps = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function SiteHeader({ activeTab, onTabChange }: SiteHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2b443a] text-[#fbf1e6] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)] sm:h-12 sm:w-12">
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

        {user && (
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="neumorphic-button flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-foreground lg:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <nav
          aria-label="Sections"
          className="flex rounded-2xl bg-[#fbf1e6] p-1 shadow-[inset_2px_2px_6px_rgba(163,130,96,0.16),inset_-2px_-2px_6px_rgba(255,253,249,0.9)]"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className="relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-initial"
            >
              {activeTab === id && (
                <motion.span
                  layoutId="header-tab"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="absolute inset-0 rounded-xl bg-[#2b443a] shadow-[2px_2px_6px_rgba(163,130,96,0.25)]"
                />
              )}
              <span
                className={`relative flex items-center gap-2 ${
                  activeTab === id ? "text-[#fbf1e6]" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </button>
          ))}
        </nav>

        {user && (
          <div className="hidden items-center gap-3 lg:flex">
            <div className="text-right leading-tight">
              <p className="max-w-[160px] truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="neumorphic-button flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
