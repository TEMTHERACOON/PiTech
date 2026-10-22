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

| Token | Value |
| --- | --- |
| Ink / primary | `#21332c` (softened from `#09251c`) |
| Accent | `#b07b45` (softened from `#a55704`) |
| Surface / tan | `#f6ddc1` (softened from `#f3d2af`) |
| Background / cream | `#fbf1e6` (softened from `#f8eadc`) |
| Shadow | `rgba(163, 130, 96, 0.18)` dark side / `rgba(255, 253, 249, 0.9)` light side |
| Font | Noto Sans |

Based on [Color Hunt · 09251ca55704f3d2aff8eadc](https://colorhunt.co/palette/09251ca55704f3d2aff8eadc),
blended toward the warm cream so the UI reads softer: lower-contrast text, warm
muted greys, and translucent neomorphic shadows instead of hard hex stops.
Brand tokens live in `src/index.css` (`--brand-ink`, `--brand-amber`,
`--brand-tan`, `--brand-cream`).

Neomorphic surfaces are utilities in `src/index.css`: `neumorphic-card`,
`neumorphic-frame`, and `neumorphic-button` (each with hover/pressed inset
states).

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
- [Lucide](https://lucide.dev) icons
