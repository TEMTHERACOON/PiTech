import { useEffect, useRef, useState } from "react"
import frameCutout from "@/assets/frame-cutout.png"
import { Camera3D, Download3D } from "@/components/icons-3d"
import { ActionButtons } from "@/components/action-buttons"
import { PhotoFrame } from "@/components/photo-frame"
import { useAuth } from "@/components/auth-provider"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { IDENTITY_TRANSFORM, type PhotoTransform } from "@/lib/photo-transform"
import { SwitchCamera } from "lucide-react"

type BoothRole = "camera" | "display" | null
type Signal = { type: string; [key: string]: unknown }
type LiveBoothPanelProps = {
  onExported?: (blob: Blob, name: string) => void
}

const channelName = (userId: string) => `pitech-photo-booth:${userId}`

export function LiveBoothPanel({ onExported }: LiveBoothPanelProps) {
  const { user } = useAuth()
  const [role, setRole] = useState<BoothRole>(null)
  const [status, setStatus] = useState("Choose a device role to begin.")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [photo, setPhoto] = useState<string | null>(null)
  const [transform, setTransform] = useState<PhotoTransform>(IDENTITY_TRANSFORM)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null)

  const startCamera = async (mode: "user" | "environment") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: mode },
      audio: false,
    })
    const nextTrack = stream.getVideoTracks()[0]
    const currentStream = streamRef.current
    const currentTrack = currentStream?.getVideoTracks()[0]
    const sender = peerRef.current
      ?.getSenders()
      .find((item) => item.track?.kind === "video")

    if (sender && nextTrack) {
      await sender.replaceTrack(nextTrack)
    }
    currentStream?.getTracks().forEach((track) => track.stop())
    streamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    if (currentTrack && currentTrack !== nextTrack) currentTrack.stop()
    setFacingMode(mode)
    setStatus(
      mode === "user"
        ? "Front camera active. The PC preview is ready."
        : "Back camera active. The PC preview is ready.",
    )
  }

  useEffect(() => {
    if (!role || !user || !supabase || !isSupabaseConfigured) return

    let active = true
    const client = supabase
    const channel = client.channel(channelName(user.id), {
      config: { broadcast: { self: false } },
    })
    channelRef.current = channel

    const send = (payload: Signal) => {
      void channel.send({ type: "broadcast", event: "signal", payload })
    }

    const createPeer = () => {
      peerRef.current?.close()
      const peer = new RTCPeerConnection()
      peerRef.current = peer
      peer.onicecandidate = (event) => {
        if (event.candidate) send({ type: "candidate", candidate: event.candidate })
      }
      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
      return peer
    }

    const handleSignal = async ({ payload }: { payload: Signal }) => {
      if (!active) return

      if (role === "camera" && payload.type === "display-ready") {
        const peer = createPeer()
        const stream = streamRef.current
        if (!stream) return
        stream.getTracks().forEach((track) => peer.addTrack(track, stream))
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        send({ type: "offer", description: offer })
        setStatus("Live preview connected to the PC.")
      }

      if (role === "display" && payload.type === "camera-ready") {
        send({ type: "display-ready" })
      }

      if (role === "camera" && payload.type === "answer" && peerRef.current) {
        await peerRef.current.setRemoteDescription(
          payload.description as RTCSessionDescriptionInit,
        )
      }

      if (role === "display" && payload.type === "offer") {
        const peer = createPeer()
        await peer.setRemoteDescription(
          payload.description as RTCSessionDescriptionInit,
        )
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        send({ type: "answer", description: answer })
        setStatus("Live preview connected. Waiting for the mobile capture.")
      }

      if (payload.type === "candidate" && peerRef.current) {
        await peerRef.current.addIceCandidate(payload.candidate as RTCIceCandidateInit)
      }

      if (role === "display" && payload.type === "photo") {
        setPhoto(String(payload.dataUrl))
        setTransform(IDENTITY_TRANSFORM)
        setStatus("Photo captured. You can download the framed image.")
      }
    }

    channel.on("broadcast", { event: "signal" }, handleSignal)
    void channel.subscribe(async (subscriptionStatus) => {
      if (subscriptionStatus !== "SUBSCRIBED") return
      if (role === "camera") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          })
          if (!active) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }
          streamRef.current = stream
          if (localVideoRef.current) localVideoRef.current.srcObject = stream
          setStatus("Camera ready. Open the PC Display role to start the preview.")
          send({ type: "camera-ready" })
        } catch {
          setStatus("Camera access was denied. Allow camera access and try again.")
        }
      } else {
        send({ type: "display-ready" })
        setStatus("Waiting for the mobile camera to connect…")
      }
    })

    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      peerRef.current?.close()
      peerRef.current = null
      if (localVideoRef.current) localVideoRef.current.srcObject = null
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      void client.removeChannel(channel)
      channelRef.current = null
    }
  }, [role, user])

  const switchCamera = async () => {
    if (role !== "camera") return
    try {
      await startCamera(facingMode === "user" ? "environment" : "user")
    } catch {
      setStatus("The other camera is not available on this device.")
    }
  }

  const capturePhoto = () => {
    const video = localVideoRef.current
    const channel = channelRef.current
    if (!video || !channel || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

    const maxWidth = 1280
    const scale = Math.min(1, maxWidth / video.videoWidth)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext("2d")
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82)
    void channel.send({
      type: "broadcast",
      event: "signal",
      payload: { type: "photo", dataUrl },
    })
    setStatus("Photo captured and sent to the PC display.")
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="neumorphic-card mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">Live Photo Booth</h2>
        <p className="text-sm font-medium text-muted-foreground">
          Configure Supabase to connect the mobile camera to the PC display.
        </p>
      </section>
    )
  }

  if (!role) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Live Photo Booth
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Use the mobile as the camera and the PC as the live preview screen.
          </p>
        </div>
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("camera")}
            className="neumorphic-button flex min-h-32 flex-col items-center justify-center gap-3 rounded-3xl px-6 text-white"
          >
            <Camera3D size={30} />
            <span className="font-semibold">Mobile Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("display")}
            className="neumorphic-button flex min-h-32 flex-col items-center justify-center gap-3 rounded-3xl px-6 text-white"
          >
            <Download3D size={30} />
            <span className="font-semibold">PC Display</span>
          </button>
        </div>
      </section>
    )
  }

  if (role === "camera") {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center">
        <div className="relative w-full overflow-hidden rounded-3xl bg-[#062b16] shadow-brand-lg">
          <video ref={localVideoRef} autoPlay muted playsInline className="aspect-square w-full object-cover" />
          <img
            src={frameCutout}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Mobile Camera</h2>
        <p role="status" className="text-sm font-medium text-muted-foreground">{status}</p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={capturePhoto}
            className="neumorphic-button flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-white"
          >
            <Camera3D size={23} />
            <span className="font-semibold">Capture Photo</span>
          </button>
          <button
            type="button"
            onClick={switchCamera}
            className="neumorphic-button flex h-12 w-full items-center justify-center gap-3 rounded-2xl text-white"
          >
            <SwitchCamera size={20} />
            <span className="font-semibold">Switch to {facingMode === "user" ? "Back" : "Front"} Camera</span>
          </button>
        </div>
        <button type="button" onClick={() => setRole(null)} className="text-sm font-semibold text-[#16794a]">
          Change device role
        </button>
      </section>
    )
  }

  return (
    <section className="flex w-full flex-col items-center gap-8">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#062b16] shadow-brand-lg">
        <video ref={remoteVideoRef} autoPlay playsInline className="aspect-square w-full object-cover" />
        <img
          src={frameCutout}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <p role="status" className="text-center text-sm font-medium text-muted-foreground">{status}</p>
      {photo ? (
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <PhotoFrame
            photo={photo}
            transform={transform}
            onTransformChange={setTransform}
            className="w-full max-w-[min(90vw,480px)]"
          />
          <ActionButtons
            photo={photo}
            fileName="photobooth.jpg"
            transform={transform}
            onExported={onExported}
          />
        </div>
      ) : null}
      <button type="button" onClick={() => setRole(null)} className="text-sm font-semibold text-[#16794a]">
        Change device role
      </button>
    </section>
  )
}
