# PiTech

A React app that places a photo inside an ornate frame, lets you save it to a
personal gallery, and download the finished picture.

| Feature | Details |
| --- | --- |
| Auth | Email + password login/register plus Google sign-in. Uses **Supabase Auth** when configured, and falls back to a local auto-approved mock otherwise. |
| App access | The workspace (frame, uploads, gallery) is gated behind login/register. |
| Tabs | **Create** (frame + actions) and **My Images** (saved gallery). |
| Frame container | `ASSETS/frame.png` — the photo is rendered inside the frame's window |
| Take Photo | Opens the device camera on mobile (`capture="environment"`) |
| Upload photo | Picks an image from the gallery to insert into the frame |
| Download | Exports the frame + photo as a 1080 × 1080 PNG — nothing else is stamped onto the export, no logos or branding |
| My Images | Saved framed photos — in Supabase Storage when configured, otherwise locally in IndexedDB |
| Storage limit | **Up to 5 photos per device.** Enforced in the database and mirrored in the client; shown in the app and the gallery counter. |
| Header / footer | Neomorphic site header (brand, tabs, account) and footer |
| Animations | Framer Motion — entrance, tab transitions, layout, and list animations |
| Hover / touch | Surfaces and buttons grow slightly on hover — or while pressed on touch devices |

> **Limit:** each device keeps **5 photos**. With Supabase this is enforced by a
> database trigger on `photo_slots`, so the client cannot bypass it. Offline it
> is enforced in the local IndexedDB gallery. Both are surfaced in the UI and
> footer.

## Getting started

```bash
npm install
npm run dev
```

The app runs with **no configuration** — it falls back to a local mock for auth
and IndexedDB for the gallery. To connect Supabase, see
[Supabase setup](#supabase-setup).

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

## Supabase setup

The app talks to Supabase through `src/lib/supabase.ts`. When
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, it uses **Supabase
Auth** and **Supabase Storage**; when they are missing it falls back to the
local mock and IndexedDB so the app still runs.

### 1. Credentials

Copy `.env.example` to `.env` and fill in both values (Supabase dashboard →
**Project Settings → API**):

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

The anon key is safe in the browser — Row Level Security is what protects your
data. Never put the `service_role` key in a `VITE_` variable; it bypasses RLS.

### 2. Local stack

The CLI and config are already in place (`supabase/config.toml`). Requires
Docker running and your user in the `docker` group.

```bash
npm run db:start    # supabase start — boots the local stack
npm run db:reset    # supabase db reset — apply migrations from scratch
npm run db:status   # supabase status — prints local URLs + keys
```

`supabase start` prints the local API URL and anon key; put those in `.env` for
local development.

### 3. Cloud project

Create the hosted project and push the schema:

```bash
supabase login                # opens a browser to authenticate
supabase projects create pitech --region <region> --org-id <org-id>
supabase link --project-ref <project-ref>
npm run db:push               # apply migrations to the linked project
supabase storage create photos   # create the bucket (or use the dashboard)
```

The `photos` bucket is private. Its policies (in the migration) scope every
object to a folder named after the user's id.

### 4. Schema

`supabase/migrations/20261022022313_init_photos.sql` defines:

| Object | Purpose |
| --- | --- |
| `public.photo_slots` | One row per saved photo: owner, storage path, name |
| `enforce_photo_limit()` + trigger | Rejects the 6th insert for an owner — the 5-photo cap |
| RLS policies | Owners can only read/write their own rows |
| Storage policies | Owners can only touch objects under their own folder |

## Auth

`src/lib/auth.ts` exposes one surface — `signInWithPassword`, `signUpWithPassword`,
`signInWithGoogle`, `getSession`, `getCurrentUser`, `onAuthStateChange`,
`signOut` — with two backends:

- **Supabase** (`supabase.auth.*`) when the env vars are set. Sessions persist
  and refresh automatically; `AuthProvider` hydrates the session on mount and
  subscribes to auth changes.
- **Local mock** otherwise, backed by `localStorage`, where every credential is
  auto-approved so the demo never blocks.

`src/components/auth-screen.tsx` and `src/components/auth-provider.tsx` are
backend-agnostic and need no changes.

## Gallery storage

`src/lib/gallery.ts` presents one interface (`listPhotos`, `addPhoto`,
`deletePhoto`, `releasePhotos`) over two backends:

- **Supabase Storage + `photo_slots`** when configured. Photos are uploaded to
  the private `photos` bucket under `<owner>/<id>.<ext>`, and the 5-photo cap is
  enforced by the database trigger — the client checks first for a fast error,
  and the trigger is the real guard.
- **IndexedDB** otherwise, keyed to the device, with the same cap enforced
  locally.

`MAX_PHOTOS_PER_DEVICE` is `5` and drives the gallery counter, the inline
notice, and the footer.

## Theme

Forest-green palette (derived from
[Color Hunt · 0107360d1c4222396ffcf1d0](https://colorhunt.co/palette/0107360d1c4222396ffcf1d0),
re-hued to green), used as **green accents on a white background**: the main app
surface is white, while buttons, icons, and the auth screen carry the green
gradient.

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#062b16` | Headings, deepest green |
| Green | `#0b3a20` | Button gradient base |
| Emerald | `#16794a` | Button gradient top, accents |
| Cream | `#fcf1d0` | Text/icon colour on green |
| Background | `#ffffff` | Main app surface |

Brand tokens live in `src/index.css` (`--brand-ink`, `--brand-green`,
`--brand-emerald`, `--brand-cream`).

### Gradients

Gradients are CSS custom properties in `src/index.css`:

| Variable | Purpose |
| --- | --- |
| `--grad-green` | Buttons and icon pods (`#16794a` → `#083a22`) |
| `--grad-green-strong` | Stronger green for emphasis |
| `--grad-page` | Auth-screen backdrop (`app-backdrop`) |

Neomorphic surfaces (`neumorphic-card`, `neumorphic-frame`,
`neumorphic-button`) use soft light shadows tuned for the white surface.
`neumorphic-button` and the `icon-3d` pod paint the **green gradient**.

### Icons

Icons are flat, single-stroke line icons from [Lucide](https://lucide.dev),
rendered white. The dimensional "3D" look comes from the gradient pod
(`icon-3d` utility) they sit on — a green gradient tile with a top highlight,
an inset bottom shadow, and a cast shadow, so the whole element reads as a
raised, physical button.

`src/components/icons-3d.tsx` wraps the Lucide glyphs behind stable semantic
names (`Camera3D`, `Image3D`, `Wand3D`, `Download3D`, `ImagePlus3D`, `LogOut3D`,
`Mail3D`, `Lock3D`, `Trash3D`, `ImageOff3D`, …). Icons use `currentColor`, so
they take the colour of their container: **white** on the green gradient
buttons, and dark green where they sit on a light surface.

## Chrome

The **header** and **footer** are fixed full-width bars — pinned to the top and
bottom of the viewport with `position: fixed`, so they always stay visible while
the content scrolls. Both are translucent white bars with a subtle divider line.

Rather than guessing the bars' height with fixed padding, the workspace measures
them with a `ResizeObserver` (`headerRef` / `footerRef` in `src/App.tsx`) and
pads the scrolling content by their real height plus a comfortable gap. This
means the content can never be hidden behind the bars, whatever the screen size
or how the header wraps.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui (`base-nova` preset, base colour `mist`)
- [Motion](https://motion.dev) (Framer Motion) for animations
- [Lucide](https://lucide.dev) flat line icons (white, on green gradient pods)
- [Supabase](https://supabase.com) — Auth + Storage, with a local CLI stack (`supabase/config.toml`, `supabase/migrations/`)
