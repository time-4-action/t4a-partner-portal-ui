# Design System

> Complete visual reference for the Patrik Partner Portal UI. Use this document to replicate or extend the design consistently.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Scrollbar](#scrollbar)
4. [Animated Background](#animated-background)
5. [Navbar](#navbar)
6. [Page Layout](#page-layout)
7. [Homepage](#homepage)
8. [Contact Page](#contact-page)
9. [Export Page](#export-page)
10. [Reusable Patterns](#reusable-patterns)
11. [Animations](#animations)
12. [Overall Aesthetic](#overall-aesthetic)

---

## Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Background | `#000000` (black) | Page background |
| Surface | `neutral-900` / `neutral-800` | Cards, panels |
| Border | `neutral-800` / `neutral-700` | Card borders, dividers |
| Text primary | `neutral-100` / white | Headings |
| Text secondary | `neutral-300` | Body text |
| Text muted | `neutral-400` / `neutral-500` | Descriptions, labels |
| Accent (primary) | `#01a0be` (cyan) | Buttons, links, highlights, focus rings |
| Accent hover | `#018a9f` | Hover state of accent |
| Success | `green-500/10` bg + `green-500/30` border + `green-400` text | Success alerts |
| Error | `red-500/10` bg + `red-500/30` border + `red-400` text | Error alerts |

---

## Typography

- **Headings (h1-h3):** `Orbitron` (Google Font) — futuristic, all-caps feel. Weights: 400, 700.
- **Body:** `Montserrat` (Google Font) — clean, modern. Weights: 400, 500, 600, 700.
- Line height: `1.6` base.
- Text is `antialiased`.

---

## Scrollbar

Custom scrollbar: 8px wide, `neutral-900` track, `neutral-700` thumb, thumb turns `#01a0be` on hover.

---

## Animated Background

8 large blurred blobs positioned absolutely behind all content. They float and morph slowly using CSS keyframe animations.

```css
/* Three animation variants */
@keyframes blob   { 0% -> 33% -> 66% -> 100%: translate + scale + rotate }
@keyframes blob2  { 0% -> 25% -> 50% -> 75% -> 66% -> 100% }
@keyframes blob3  { same structure, different values }

/* Delays */
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
.animation-delay-6000 { animation-delay: 6s; }
```

### Blob Positions and Colors

| Position | Size | Color | Animation | Delay |
|----------|------|-------|-----------|-------|
| Top-left | `w-72 h-72` | `bg-blue-500/20` | `animate-blob` | 2s |
| Top-right | `w-80 h-80` | `bg-cyan-500/20` | `animate-blob2` | — |
| Bottom-left | `w-96 h-96` | `bg-sky-500/20` | `animate-blob` | 4s |
| Center | `w-[28rem] h-[28rem]` | `bg-blue-700/10` | `animate-blob3` | 2s |
| Bottom-right | `w-64 h-64` | `bg-cyan-400/20` | `animate-blob2` | 6s |
| Mid-left | `w-56 h-56` | `bg-sky-400/20` | `animate-blob` | 2s |
| Center-left | `w-48 h-48` | `bg-blue-400/10` | `animate-blob3` | — |
| Bottom-center | `w-72 h-72` | `bg-cyan-600/10` | `animate-blob` | 4s |

All blobs use `rounded-full filter blur-3xl` (except two that use `blur-2xl`). Content sits above blobs via `relative z-10`.

---

## Navbar

**Sticky top-0**, `z-50`, black with 60% opacity + `backdrop-blur-md`, bottom border `border-neutral-800`.

Height: `h-16`. Max width: `max-w-screen-2xl mx-auto`.

### Left Side

- Company logo image (120x60px)
- Brand name text: `"Partner Portal"` — Orbitron font, `text-lg`, `tracking-wide`, hidden on mobile (`hidden sm:block`)

### Desktop Nav Links (hidden on mobile)

- `text-neutral-300`, hover: `text-[#01a0be]`
- Animated underline on hover: `::after` pseudo-element scales from 0 to full width on hover (`scale-x-0 -> scale-x-100`, `transition-transform duration-300`)
- Underline color: `#01a0be`, height `2px`

### Desktop Auth Area

- **Loading:** Pulsing gray circle (`w-8 h-8 bg-neutral-700 rounded-full animate-pulse`)
- **Logged in:** Pill button (`rounded-full bg-neutral-800/50`) with avatar + name. Click opens dropdown:
  - Dropdown: `w-48`, `bg-neutral-800`, `rounded-md`, `shadow-lg`, `ring-1 ring-black`
  - Shows name + email (small, muted), then "Log Out" link
- **Logged out:** `"Partner Login"` button — `bg-[#01a0be]`, `rounded-md`, `px-3.5 py-2`, hover `bg-[#018a9f]`

### Mobile

- Hamburger icon (3 lines / X), `text-neutral-400`, hover `bg-neutral-700`
- Full-width overlay (`bg-black/30`) dims page when menu open
- Mobile menu slides in: nav links as block items, `hover:bg-neutral-700`, auth button at bottom separated by `border-neutral-700`

---

## Page Layout

All pages share this wrapper:

```
relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16 lg:px-8
```

Content is centered both horizontally and vertically. Max width varies: `max-w-3xl` or `max-w-4xl`.

---

## Homepage

### Guest View (logged out)

Centered hero layout:

1. **Badge pill** — `rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10 px-4 py-1.5 text-xs text-[#01a0be] tracking-widest uppercase`
2. **H1** — Orbitron, `text-4xl -> text-6xl`. Gradient span: `bg-gradient-to-r from-[#01a0be] to-cyan-300 bg-clip-text text-transparent`
3. **Subtext** — `text-lg text-neutral-400 max-w-xl mx-auto`
4. **Stats row** — 3 stat blocks, `gap-8 sm:gap-16`. Each: large bold Orbitron value, tiny `uppercase tracking-widest text-neutral-500` label
5. **Horizontal divider** — `h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent`
6. **CTA buttons** — stacked on mobile, row on `sm+`:
   - Primary: `bg-[#01a0be] rounded-xl px-6 py-3 shadow-lg shadow-[#01a0be]/20` with icon
   - Secondary: `border border-neutral-700 bg-neutral-900/60 rounded-xl backdrop-blur-sm text-neutral-300`

### Authenticated View (logged in)

Same badge + h1 + subtext at top, then:

**2-column card grid** (`grid-cols-1 sm:grid-cols-2 gap-6`):

Each card:
- `rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-8`
- Hover: `border-[#01a0be]/50 bg-neutral-900/80 shadow-[0_0_40px_rgba(1,160,190,0.1)]` (cyan glow)
- Transition: `duration-300`
- **Icon box:** `h-12 w-12 rounded-xl bg-[#01a0be]/10 border border-[#01a0be]/20`, icon `text-[#01a0be]`
- **Title:** `text-xl font-semibold text-white`, hover: `text-[#01a0be]`
- **Description:** `text-sm text-neutral-400 leading-relaxed`
- **Footer link:** `text-sm font-medium text-[#01a0be]` + arrow icon that slides right on hover (`group-hover:translate-x-1`)

---

## Contact Page

Max width `max-w-3xl`.

1. **H2** — Orbitron, `text-3xl sm:text-4xl text-neutral-100`
2. **Subtext** — `text-lg text-neutral-300`
3. **Alert banners** (success/error):
   - `p-4 rounded-xl animate-fade-in` with colored bg/border (10% opacity bg, 30% opacity border)
   - Icon + bold message + small sub-message
4. **Form card:** `bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-6 sm:p-8 border border-neutral-700/50`
   - 2-column grid (`sm:grid-cols-2 gap-x-6 gap-y-6`): Name, Company (side by side), Email (full width), Message textarea (full width)
   - **Input style:** `rounded-lg bg-white/5 px-3.5 py-2.5 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-[#01a0be]`
   - **Labels:** `text-sm font-semibold text-neutral-100`
   - **Submit button:** Full width, `bg-[#01a0be] rounded-lg py-3`, arrow icon slides on hover. Disabled state: 50% opacity + spinner icon.

---

## Export Page

Dark dashboard layout. Two-panel structure on large screens (sidebar config + main area).

### Preset Selector Tabs

4 presets: **Shopify**, **Simple**, **Detailed**, **Inventory** — displayed as horizontal tab buttons with icons. Active tab uses `bg-[#01a0be]/20 text-[#01a0be] border-[#01a0be]/50`.

### Format Badges

Small pill buttons for output format: **CSV** (emerald), **JSON** (amber), **XML** (orange). Each has a matching icon. Active format highlights with its color's `bg-*/20` and `text-*-400`.

### Configuration Panels (collapsible sections)

- Section headers with chevron toggle
- Dark panel backgrounds: `bg-neutral-900/50` or `bg-neutral-800/50`
- Rounded corners `rounded-xl`, borders `border-neutral-700/50`

### Field Checkboxes

Grid of toggleable field chips. Selected: `bg-[#01a0be]/20 border-[#01a0be]/50 text-[#01a0be]`. Unselected: `bg-neutral-800/50 border-neutral-700 text-neutral-400`.

### Filter Inputs

Same input style as contact form (`bg-white/5 ring-white/10`). Range sliders, category multi-selects.

### Action Buttons

- **Download:** `bg-[#01a0be]` primary button
- **Preview / API Link:** Secondary/ghost style with `border border-neutral-700`
- **Save config / Load config:** Small icon buttons, neutral style

### Saved Configs List

Cards with config name, preset badge, delete button (trash icon, red on hover).

---

## Reusable Patterns

### Primary Button

```
bg-[#01a0be] hover:bg-[#018a9f] rounded-xl px-6 py-3 text-sm font-semibold text-white
shadow-lg shadow-[#01a0be]/20 transition-all
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be]
```

### Secondary / Ghost Button

```
border border-neutral-700 bg-neutral-900/60 rounded-xl px-6 py-3
text-sm font-semibold text-neutral-300 hover:border-neutral-600 hover:text-white
backdrop-blur-sm transition-all
```

### Card

```
rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-8
hover:border-[#01a0be]/50 hover:shadow-[0_0_40px_rgba(1,160,190,0.1)] transition-all duration-300
```

### Text Input / Textarea

```
rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-white
ring-1 ring-inset ring-white/10 placeholder:text-neutral-500
focus:ring-2 focus:ring-inset focus:ring-[#01a0be]
transition-all
```

### Badge Pill

```
rounded-full border border-[#01a0be]/30 bg-[#01a0be]/10
px-4 py-1.5 text-xs font-medium text-[#01a0be] tracking-widest uppercase
```

### Gradient Heading Span

```
bg-gradient-to-r from-[#01a0be] to-cyan-300 bg-clip-text text-transparent
```

### Icon Box (card icon container)

```
h-12 w-12 rounded-xl bg-[#01a0be]/10 border border-[#01a0be]/20
flex items-center justify-center
group-hover:bg-[#01a0be]/20 transition-colors
```

### Horizontal Divider

```
h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent
```

---

## Animations

| Class | Keyframe | Duration |
|-------|----------|----------|
| `animate-blob` | translate + scale + rotate, 3 stops | 25s infinite |
| `animate-blob2` | translate + scale + rotate, 4 stops | 30s infinite |
| `animate-blob3` | translate + scale + rotate, 3 stops | 35s infinite |
| `animate-fade-in` | opacity 0->1, translateY -10px->0 | 0.3s ease-in-out |

Arrow icons on interactive elements slide right on hover: `transition-transform group-hover:translate-x-1`.

---

## Overall Aesthetic

**Dark cyberpunk-lite.** Pure black base, soft glowing blobs create depth without clutter. The `#01a0be` cyan accent is used consistently for all interactive states — hover, focus, active, selected. Text hierarchy is strict: white headings -> neutral-300 body -> neutral-400/500 muted. Cards are glassy (`backdrop-blur-sm`, semi-transparent backgrounds). Everything uses smooth transitions (`duration-300`). The Orbitron font gives a technical/futuristic feel to headings while Montserrat keeps body text readable.
