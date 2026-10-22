# PiTech

A React app that places a photo inside an ornate frame, lets you save it to a
personal gallery, and download the finished picture.

| Feature | Details |
| --- | --- |
| Auth | Email + password login/register plus Google sign-in. **Auto-approved** — no email confirmation. Currently a local mock; Supabase auth is coming soon. |
| App access | The workspace (frame, uploads, gallery) is gated behind login/register. |
| Tabs | **Create** (frame + actions) and **My Images** (saved gallery). |
| Frame container | `ASSETS/frame.png` — the photo is rendered inside the frame's window |
| Take Photo | Opens the device camera on mobile (`capture="environment"`) |
| Upload photo | Picks an image from the gallery to insert into the frame |
| Download | Exports the frame + photo as a 1080 × 1080 PNG — nothing else is stamped onto the export, no logos or branding |
| My Images | Saved framed photos, stored **locally on the device** in IndexedDB |
| Storage limit | **Up to 5 photos per device.** The limit is shown in the app and in the gallery counter. |
| Header / footer | Neomorphic site header (brand, tabs, account) and footer |
| Animations | Framer Motion — entrance, tab transitions, layout, and list animations |
| Hover / touch | Surfaces and buttons grow slightly on hover — or while pressed on touch devices |

> **Planned limit:** each device (and later, each Supabase account) may keep **5
> photos**. This is enforced today in the local gallery and surfaced in the UI
> and footer.

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
on a `<canvas>` at 1080 × 1080.

The frame container is rounded in the UI only — the exported PNG keeps the artwork's
original square corners.

The container also carries an 8 px cream (`#f8eadc`) outline with a soft
neumorphic shadow cast outside it. Like the rounding, both are pure CSS and never
reach the export.

To regenerate the cut-out after replacing the frame artwork:

```powershell
pwsh -File scripts\generate-frame-cutout.ps1
```

## Layout

```
┌───────────────────────────────────────────────────────────┐
│  [◉] PiTech · Frame your memories           [Create][Images]│  ← header
├──────────────────────────────┬────────────────────────────┤
│                              │                            │
│      Frame + photo           │                            │
│      (frame-cutout.png       │                            │
│       layered on top)        │                            │
│                              │                            │
│                              │  [Take] [Upload] [Download] │
├──────────────────────────────┴────────────────────────────┤
│  [◉] PiTech · © 2026                  Made with ♥          │  ← footer
│           Up to 5 photos can be stored per device.         │
└───────────────────────────────────────────────────────────┘
```

The **My Images** tab shows the saved gallery with a live `n / 5` counter. On
narrow screens the columns stack vertically and the header wraps into rows.

## Auth (temporary mock)

`src/lib/auth.ts` implements the auth surface the app needs — `signInWithPassword`,
`signUpWithPassword`, `signInWithGoogle`, `getSession`, `signOut` — backed by
`localStorage`. Every credential is accepted and auto-approved, so the demo never
blocks. Swapping in Supabase later means replacing those function bodies while
keeping the same signatures; the UI in `src/components/auth-screen.tsx` and
`src/components/auth-provider.tsx` does not need to change.

## Gallery storage

Saved photos live in IndexedDB (`src/lib/gallery.ts`), keyed to the device — not
the account. `MAX_PHOTOS_PER_DEVICE` is `5`; the cap is enforced on save and shown
in the gallery header, an inline notice, and the footer.

## Theme

Dark navy theme built on
[Color Hunt · 0107360d1c4222396ffcf1d0](https://colorhunt.co/palette/0107360d1c4222396ffcf1d0).

| Token | Value | Use |
| --- | --- | --- |
| Ink / background | `#010736` | Page backdrop base |
| Navy | `#0d1c42` | Card / surface base |
| Indigo | `#22396f` | Raised surfaces, borders |
| Cream | `#fcf1d0` | Text, accents, CTAs |
| Cream deep | `#e4cf94` | Gradient end for cream elements |

Brand tokens live in `src/index.css` (`--brand-ink`, `--brand-navy`,
`--brand-indigo`, `--brand-cream`).

### Gradients

Gradients are defined as CSS custom properties in `src/index.css` and reused
across the UI:

| Variable | Purpose |
| --- | --- |
| `--grad-page` | Page backdrop wash (`app-backdrop`) |
| `--grad-surface` | Card / frame surfaces |
| `--grad-raised` | Raised buttons and icon pods |
| `--grad-accent` | Cream CTA gradient |

Neomorphic surfaces are utilities in `src/index.css`: `neumorphic-card`,
`neumorphic-frame`, and `neumorphic-button` — each uses the navy gradients with
a top sheen (`inset 0 1px 0`) and dual soft shadows tuned for the dark surface.

### 3D icons

`src/components/icons-3d.tsx` holds a self-contained 3D icon set (`Camera3D`,
`Image3D`, `Wand3D`, `Download3D`, `ImagePlus3D`, `LogOut3D`, `Mail3D`,
`Lock3D`, `Trash3D`, `ImageOff3D`). Each is an inline SVG drawn with layered
linear gradients, a highlight, and a drop shadow so it reads as a dimensional
object. They take a `size` prop and need no external asset or icon font.

Icons are seated on gradient pods via the `icon-3d` / `icon-3d-cream` utilities
(inset highlight + inset shadow + cast shadow), which gives every control a
beveled, physical look.

## Chrome

The **header** and **footer** are fixed full-width bars — pinned to the top and
bottom of the viewport with `position: fixed`, so they always stay visible while
the content scrolls. Both are flat solid `background` bars with a subtle divider
line. The scrolling content is padded (`pt-28` / `pb-28` on mobile, `pt-32` on
larger screens) so it clears the bars and is never hidden behind them.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui (`base-nova` preset, base colour `mist`)
- [Motion](https://motion.dev) (Framer Motion) for animations
- [Lucide](https://lucide.dev) icons (utility/eye toggle glyphs)
- Custom inline 3D SVG icon set (`src/components/icons-3d.tsx`)
