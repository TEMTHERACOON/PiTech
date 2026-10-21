# PiTech

**Memories Forever Digitlized!**

A tiny React app that places a photo inside an ornate frame and lets you download the
finished picture.

| Feature | Details |
| --- | --- |
| Frame container | `ASSETS/frame.png` — the photo is rendered inside the frame's window |
| Upload photo | Inserts (or replaces) the single photo held by the frame |
| Download | Exports the frame + photo as a 1080 × 1080 PNG |

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # type-check and build to dist/
npm run preview   # preview the production build
npm run lint      # oxlint
```

## How it works

The original frame artwork is fully opaque, so there is no room for a photo. The
`scripts/generate-frame-cutout.ps1` script flood-fills the white area that forms the
photo window and writes `src/assets/frame-cutout.png` — the same frame with that window
made transparent.

At runtime the photo is rendered underneath that cut-out frame, so it shows through the
window with a pixel-perfect edge. The download button repeats the exact same compositing
on a `<canvas>` at 1080 × 1080, which means the downloaded PNG is pixel-identical to what
is on screen.

To regenerate the cut-out after replacing the frame artwork:

```powershell
pwsh -File scripts\generate-frame-cutout.ps1
```

## Layout

```
┌──────────────────────────────┬───────────────────────────┐
│                              │      PiTech logo          │
│                              │  "Memories Forever        │
│      Frame + photo           │       Digitlized!"        │
│      (frame-cutout.png       │      AllianCICS logo      │
│       layered on top)        │                           │
│                              │   [Download] [Upload]     │
└──────────────────────────────┴───────────────────────────┘
```

On narrow screens the two columns stack vertically.

## Theme

| Token | Value |
| --- | --- |
| Background / card | `#ffffff` |
| Text | `#2d336b` |
| Shadows | `#a9b5df` |
| Font | Noto Sans |

Brand tokens live in `src/index.css` (`--brand-ink`, `--brand-shadow`) and are exposed to
Tailwind as `text-brand`, `shadow-brand` and `drop-shadow-brand`.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui (`base-nova` preset, base colour `mist`)
