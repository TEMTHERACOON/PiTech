/**
 * 3D icon set — powered by Iconify (offline).
 *
 * Icons come from the Fluent Emoji set (Microsoft's Fluent design), which ships
 * colorful, dimensional artwork. Only the handful of icons this app uses are
 * bundled, as a curated subset in `src/lib/fluent-emoji-subset.json`, and
 * registered with Iconify up front — nothing is fetched from the Iconify API at
 * runtime.
 *
 * Each export keeps a stable, semantic name so callers don't depend on the
 * underlying icon-set identifiers.
 */

import { addCollection, Icon } from "@iconify/react"
import subset from "@/lib/fluent-emoji-subset.json"

// Register the curated set once, at module load, so icons render offline.
addCollection(subset as Parameters<typeof addCollection>[0])

type Icon3DProps = {
  size?: number
  className?: string
}

const SET = "fluent-emoji"

function I({ name, size, className = "" }: Icon3DProps & { name: string }) {
  return (
    <Icon
      icon={`${SET}:${name}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  )
}

export function Camera3D(props: Icon3DProps) {
  return <I name="camera" {...props} />
}

export function Image3D(props: Icon3DProps) {
  return <I name="framed-picture" {...props} />
}

export function Wand3D(props: Icon3DProps) {
  return <I name="magic-wand" {...props} />
}

export function Download3D(props: Icon3DProps) {
  return <I name="outbox-tray" {...props} />
}

export function ImagePlus3D(props: Icon3DProps) {
  return <I name="inbox-tray" {...props} />
}

export function LogOut3D(props: Icon3DProps) {
  return <I name="door" {...props} />
}

export function Mail3D(props: Icon3DProps) {
  return <I name="envelope" {...props} />
}

export function Lock3D(props: Icon3DProps) {
  return <I name="locked" {...props} />
}

export function Trash3D(props: Icon3DProps) {
  return <I name="wastebasket" {...props} />
}

export function ImageOff3D(props: Icon3DProps) {
  return <I name="framed-picture" {...props} />
}

export function Sparkles3D(props: Icon3DProps) {
  return <I name="sparkles" {...props} />
}

export function Save3D(props: Icon3DProps) {
  return <I name="floppy-disk" {...props} />
}

export function Folder3D(props: Icon3DProps) {
  return <I name="open-file-folder" {...props} />
}
