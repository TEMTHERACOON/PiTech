/**
 * Flat line icons.
 *
 * These are simple single-stroke icons from Lucide. They use `currentColor`,
 * so they take the colour of their container — white on the green gradient,
 * dark green on light surfaces. The dimensional "3D" look comes from the
 * gradient pod (`icon-3d`) they are placed on, not from the artwork itself.
 *
 * Each export keeps a stable, semantic name so callers don't depend on the
 * underlying icon identifiers.
 */

import type { ComponentProps } from "react"
import {
  Camera,
  Download,
  Image as ImageIcon,
  ImageOff,
  ImagePlus,
  Lock,
  LogOut,
  Mail,
  RotateCcw,
  Trash2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

type LucideIcon = typeof Camera
type IconProps = ComponentProps<LucideIcon>

/**
 * Wraps a Lucide icon. Icons use `currentColor`, so they take the colour of
 * their container — set `className="text-white"` where the icon sits on the
 * green gradient, or a dark green where it sits on a light surface.
 */
function makeIcon(Glyph: LucideIcon) {
  return function Icon3D({ className = "", strokeWidth = 1.75, ...props }: IconProps) {
    return (
      <Glyph
        strokeWidth={strokeWidth}
        aria-hidden="true"
        className={className}
        {...props}
      />
    )
  }
}

export const Camera3D = makeIcon(Camera)
export const Image3D = makeIcon(ImageIcon)
export const ImageOff3D = makeIcon(ImageOff)
export const Wand3D = makeIcon(Wand2)
export const Download3D = makeIcon(Download)
export const ImagePlus3D = makeIcon(ImagePlus)
export const LogOut3D = makeIcon(LogOut)
export const Mail3D = makeIcon(Mail)
export const Lock3D = makeIcon(Lock)
export const Trash3D = makeIcon(Trash2)
export const ZoomIn3D = makeIcon(ZoomIn)
export const ZoomOut3D = makeIcon(ZoomOut)
export const Reset3D = makeIcon(RotateCcw)
