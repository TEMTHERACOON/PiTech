import { motion } from "motion/react"
import { useAuth } from "@/components/auth-provider"
import { Camera3D, Image3D, LogOut3D, Wand3D } from "@/components/icons-3d"

export type Tab = "create" | "images"

const TABS: { id: Tab; label: string; Icon: typeof Camera3D }[] = [
  { id: "create", label: "Create", Icon: Wand3D },
  { id: "images", label: "My Images", Icon: Image3D },
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
          <span className="icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white sm:h-12 sm:w-12">
            <Camera3D size={26} />
          </span>
          <div className="flex flex-col text-left leading-tight">
            <span className="bg-gradient-to-br from-[#16794a] to-[#062b16] bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
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
            className="neumorphic-button flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl lg:hidden"
          >
            <LogOut3D size={20} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <nav
          aria-label="Sections"
          className="flex rounded-2xl bg-[#eaf5ee] p-1 shadow-[inset_2px_2px_6px_rgba(20,102,58,0.14),inset_-2px_-2px_6px_rgba(255,255,255,0.95)]"
        >
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-initial"
              >
                {isActive && (
                  <motion.span
                    layoutId="header-tab"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#16794a] to-[#0b3a20] shadow-[2px_2px_8px_rgba(20,102,58,0.4),inset_0_1px_0_rgba(252,241,208,0.2)]"
                  />
                )}
                <span
                  className={`relative flex items-center gap-2 ${
                    isActive ? "text-[#fcf1d0]" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </span>
              </button>
            )
          })}
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
              className="neumorphic-button flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl"
            >
              <LogOut3D size={20} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
