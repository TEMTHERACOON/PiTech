import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ActionButtons } from "@/components/action-buttons"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AuthScreen } from "@/components/auth-screen"
import { GalleryPanel } from "@/components/gallery-panel"
import { PhotoFrame } from "@/components/photo-frame"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader, type Tab } from "@/components/site-header"
import { Loader2 } from "lucide-react"

type PendingExport = { blob: Blob; name: string }

function CreatePanel({
  photo,
  fileName,
  onSelectPhoto,
  onExported,
}: {
  photo: string | null
  fileName: string | null
  onSelectPhoto: (file: File) => void
  onExported: (blob: Blob, name: string) => void
}) {
  return (
    <section className="flex w-full flex-col items-center gap-8 sm:gap-10 md:gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex w-full justify-center"
      >
        <PhotoFrame
          photo={photo}
          className="w-full max-w-[min(90vw,480px)] sm:max-w-[min(85vw,520px)]"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
        className="flex w-full max-w-md flex-col items-center gap-8 text-center sm:gap-10"
      >
        <ActionButtons
          photo={photo}
          fileName={fileName}
          onSelectPhoto={onSelectPhoto}
          onExported={onExported}
        />
      </motion.div>
    </section>
  )
}

function Workspace() {
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<Tab>("create")
  const [photo, setPhoto] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingExport | null>(null)

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo)
    }
  }, [photo])

  const handleSelectPhoto = (file: File) => {
    setPhoto(URL.createObjectURL(file))
    setFileName(file.name)
  }

  const handleExported = useCallback((blob: Blob, name: string) => {
    setPending({ blob, name })
    setTab("images")
  }, [])

  const handlePendingConsumed = useCallback(() => setPending(null), [])

  if (isLoading) {
    return (
      <main className="app-backdrop flex min-h-screen items-center justify-center text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-[#fcf1d0]" />
      </main>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <main className="flex min-h-screen w-full flex-col bg-white text-foreground">
      {/* Header — fixed to the top of the viewport */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#d3e8da] bg-white/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <SiteHeader activeTab={tab} onTabChange={setTab} />
        </div>
      </header>

      {/* Scrolling content — padded to clear the fixed bars */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-28 pb-28 sm:px-6 sm:pt-32 sm:pb-28">
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
              <CreatePanel
                photo={photo}
                fileName={fileName}
                onSelectPhoto={handleSelectPhoto}
                onExported={handleExported}
              />
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
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d3e8da] bg-white/90 backdrop-blur-md">
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
