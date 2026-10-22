/**
 * 3D icon set.
 *
 * Each icon is an inline SVG drawn with layered linear gradients, a top
 * highlight, and a drop shadow so it reads as a dimensional object rather than
 * a flat line icon. They inherit sizing from the `size` prop and are
 * self-contained (no external asset or icon-font dependency).
 */

type Icon3DProps = {
  size?: number
  className?: string
}

const NAVY_DEEP = "#14295d"
const NAVY_MID = "#22396f"
const NAVY_LIGHT = "#3f5aa0"
const CREAM = "#fcf1d0"
const CREAM_DEEP = "#e4cf94"

function base(size: number, className: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
  }
}

/** Shared filter giving every icon its soft cast shadow. */
function ShadowDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-shadow`} x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow
          dx="0"
          dy="2.5"
          stdDeviation="2.5"
          floodColor="#000214"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
  )
}

export function Camera3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-camera"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="55%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-lens`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <path
          d="M10 17.5h6.4l2.6-3.6h10l2.6 3.6H38a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3v-13a3 3 0 0 1 3-3Z"
          fill={`url(#${id}-body)`}
        />
        <path
          d="M10 17.5h6.4l2.6-3.6h10l2.6 3.6H38a3 3 0 0 1 3 3v3H7v-3a3 3 0 0 1 3-3Z"
          fill={`url(#${id}-top)`}
        />
        <circle cx="24" cy="26.5" r="7.4" fill={NAVY_DEEP} />
        <circle cx="24" cy="26.5" r="5.4" fill={`url(#${id}-lens)`} />
        <circle cx="21.6" cy="24" r="1.7" fill="#ffffff" fillOpacity="0.85" />
        <circle cx="35" cy="21.5" r="1.4" fill={CREAM} fillOpacity="0.85" />
      </g>
    </svg>
  )
}

export function Image3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-image"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="55%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="7" y="10" width="34" height="28" rx="4" fill={`url(#${id}-card)`} />
        <rect x="7" y="10" width="34" height="12" rx="4" fill={`url(#${id}-gloss)`} />
        <circle cx="17" cy="19.5" r="3" fill={CREAM} />
        <path d="M9 34l8.5-9.5 5 5.4 4.2-4.6L36 34H9Z" fill={`url(#${id}-hill)`} />
      </g>
    </svg>
  )
}

export function Wand3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-wand"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-stick`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="100%" stopColor={NAVY_LIGHT} />
        </linearGradient>
        <linearGradient id={`${id}-tip`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect
          x="10"
          y="26"
          width="24"
          height="6"
          rx="3"
          transform="rotate(-45 10 26)"
          fill={`url(#${id}-stick)`}
        />
        <path
          d="M32 10l2.4 5.6L40 18l-5.6 2.4L32 26l-2.4-5.6L24 18l5.6-2.4L32 10Z"
          fill={`url(#${id}-tip)`}
        />
        <circle cx="38.5" cy="27.5" r="1.8" fill={CREAM} fillOpacity="0.9" />
        <circle cx="14" cy="13" r="1.4" fill={CREAM} fillOpacity="0.7" />
      </g>
    </svg>
  )
}

export function Download3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-download"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-arrow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-tray`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <path
          d="M24 9v16m0 0l-7-7m7 7l7-7"
          stroke={`url(#${id}-arrow)`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 32v3.5A2.5 2.5 0 0 0 12.5 38h23a2.5 2.5 0 0 0 2.5-2.5V32"
          stroke={`url(#${id}-tray)`}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function ImagePlus3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-imageplus"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="55%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-plus`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="6" y="11" width="30" height="25" rx="4" fill={`url(#${id}-card)`} />
        <circle cx="15" cy="20" r="2.7" fill={CREAM} />
        <path d="M8 33l8-9 4.6 5 3.9-4.3L30 33H8Z" fill={`url(#${id}-hill)`} />
        <circle cx="37" cy="13" r="8" fill={`url(#${id}-plus)`} />
        <path
          d="M37 9.5v7M33.5 13h7"
          stroke={NAVY_DEEP}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function LogOut3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-logout"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-door`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-arrow`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <path
          d="M20 12h-6a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h6"
          stroke={`url(#${id}-door)`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M28 17l7 7-7 7"
          stroke={`url(#${id}-arrow)`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M35 24H22"
          stroke={`url(#${id}-arrow)`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function Mail3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-mail"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-env`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="55%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-flap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="6" y="12" width="36" height="24" rx="4" fill={`url(#${id}-env)`} />
        <path
          d="M7.5 14.5 24 26 40.5 14.5"
          stroke={`url(#${id}-flap)`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

export function Lock3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-lock"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-shackle`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="100%" stopColor={NAVY_MID} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <path
          d="M17 22v-4a7 7 0 0 1 14 0v4"
          stroke={`url(#${id}-shackle)`}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect x="11" y="22" width="26" height="18" rx="5" fill={`url(#${id}-body)`} />
        <circle cx="24" cy="30" r="3" fill={NAVY_DEEP} />
        <rect x="22.6" y="30" width="2.8" height="5" rx="1.4" fill={NAVY_DEEP} />
      </g>
    </svg>
  )
}

export function Trash3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-trash"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="11" y="16" width="26" height="22" rx="4" fill={`url(#${id}-body)`} />
        <rect x="8" y="12" width="32" height="5" rx="2.5" fill={`url(#${id}-lid)`} />
        <rect x="19" y="9" width="10" height="4" rx="2" fill={`url(#${id}-lid)`} />
        <path
          d="M18.5 22v11M24 22v11M29.5 22v11"
          stroke={CREAM}
          strokeOpacity="0.45"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function ImageOff3D({ size = 24, className = "" }: Icon3DProps) {
  const id = "ic-imageoff"
  return (
    <svg {...base(size, className)}>
      <ShadowDefs id={id} />
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id={`${id}-slash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CREAM} />
          <stop offset="100%" stopColor={CREAM_DEEP} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="7" y="10" width="34" height="28" rx="4" fill={`url(#${id}-card)`} />
        <circle cx="17" cy="19.5" r="3" fill={CREAM} fillOpacity="0.6" />
        <path
          d="M9 34l8.5-9.5 5 5.4 4.2-4.6L36 34H9Z"
          fill={CREAM}
          fillOpacity="0.4"
        />
        <path
          d="M10 38 38 10"
          stroke={`url(#${id}-slash)`}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
