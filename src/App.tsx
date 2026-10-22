import { useEffect, useState } from "react"
import { ActionButtons } from "@/components/action-buttons"
import { BrandPanel } from "@/components/brand-panel"
import { PhotoFrame } from "@/components/photo-frame"
import { SiteHeader } from "@/components/site-header"

function App() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo)
    }
  }, [photo])

  const handleSelectPhoto = (file: File) => {
    setPhoto(URL.createObjectURL(file))
    setFileName(file.name)
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:gap-12 lg:py-16">
        <SiteHeader />

        <div className="flex w-full flex-col items-center gap-8 sm:gap-10 md:gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          {/* Left — frame container with the photo inside */}
          <PhotoFrame
            photo={photo}
            className="w-full max-w-[min(90vw,480px)] sm:max-w-[min(85vw,520px)]"
          />

          {/* Right — branding and actions */}
          <section className="flex w-full max-w-md flex-col items-center gap-8 text-center sm:gap-10">
            <BrandPanel />

            <ActionButtons
              photo={photo}
              fileName={fileName}
              onSelectPhoto={handleSelectPhoto}
            />
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
