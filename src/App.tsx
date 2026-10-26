import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AuthScreen } from "@/components/auth-screen"
import { GalleryPanel } from "@/components/gallery-panel"
import { LiveBoothPanel } from "@/components/live-booth-panel"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader, type Tab } from "@/components/site-header"
import { Loader2 } from "lucide-react"

type PendingExport = { blob: Blob; name: string }

function Workspace() {
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<Tab>("create")
  const [pending, setPending] = useState<PendingExport | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const [chrome, setChrome] = useState({ top: 112, bottom: 96 })

  // Measure the fixed bars and use their real heights to pad the scrolling
  // content, so it always clears them — no guessing, no overlap.
  useEffect(() => {
    const header = headerRef.current
    const footer = footerRef.current
    if (!header || !footer) return

    const measure = () => {
      setChrome({
        top: Math.ceil(header.getBoundingClientRect().height),
        bottom: Math.ceil(footer.getBoundingClientRect().height),
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [user])

  const handleExported = useCallback((blob: Blob, name: string) => {
    setPending({ blob, name })
    setTab("images")
  }, [])

  const handlePendingConsumed = useCallback(() => setPending(null), [])

  if (isLoading) {
    return (
      <main className="app-backdrop relative flex min-h-screen items-center justify-center overflow-hidden text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="blob-a absolute -top-24 -left-24 h-[52vmin] w-[52vmin] rounded-full bg-[radial-gradient(circle_at_30%_30%,#16794a_0%,rgba(22,121,74,0.55)_45%,rgba(22,121,74,0)_72%)] opacity-60 blur-3xl" />
          <div className="blob-b absolute -right-24 bottom-0 h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(circle_at_70%_70%,#0b3a20_0%,rgba(11,58,32,0.5)_45%,rgba(11,58,32,0)_72%)] opacity-50 blur-3xl" />
        </div>
        <Loader2 className="relative h-6 w-6 animate-spin text-[#fcf1d0]" />
      </main>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-white text-foreground">
      {/* Decorative gradient blobs — drift slowly behind the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="blob-a absolute -top-24 -left-24 h-[52vmin] w-[52vmin] rounded-full bg-[radial-gradient(circle_at_30%_30%,#16794a_0%,rgba(22,121,74,0.55)_45%,rgba(22,121,74,0)_72%)] opacity-60 blur-3xl" />
        <div className="blob-b absolute -right-24 bottom-0 h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(circle_at_70%_70%,#0b3a20_0%,rgba(11,58,32,0.5)_45%,rgba(11,58,32,0)_72%)] opacity-50 blur-3xl" />
      </div>

      {/* Header — fixed to the top of the viewport */}
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-[#d3e8da] bg-white/90 backdrop-blur-md"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <SiteHeader activeTab={tab} onTabChange={setTab} />
        </div>
      </header>

      {/* Scrolling content — padded to clear the measured height of the bars */}
      <div
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-8 sm:px-6"
        style={{ paddingTop: chrome.top + 24, paddingBottom: chrome.bottom + 24 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex w-full flex-col"
          >
            {tab === "create" ? (
              <LiveBoothPanel onExported={handleExported} />
            ) : (
              <GalleryPanel
                pendingBlob={pending?.blob ?? null}
                pendingName={pending?.name ?? null}
                onPendingConsumed={handlePendingConsumed}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer — fixed to the bottom of the viewport */}
      <footer
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d3e8da] bg-white/90 backdrop-blur-md"
      >
        <SiteFooter />
      </footer>
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <Workspace />
    </AuthProvider>
  )
}

export default App
