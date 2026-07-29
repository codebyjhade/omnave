# Omnave Design System (ODS)
**Version 2.0 — Reverse-Engineered from the Home Dashboard**
> The Home Dashboard (`/app/home/page.tsx`) is the **canonical source of truth**. Every value in this document was extracted directly from it. Nothing was invented.

---

## 0. Design Identity

**Aesthetic:** "Friendly EdTech" — warm, approachable, motivating. NOT a dark-mode developer tool.
**Philosophy:** A clean white canvas grounded by a vibrant purple header. Cards lift off the canvas with subtle shadows. Motion is springy and tactile.
**Font:** `Poppins` (Google Fonts, loaded via `next/font/google`)

---

## 1. Color System

All colors are **exact** — extracted from source files. Do not approximate.

### 1.1 Brand Palette

| Token | Hex Value | Usage |
|---|---|---|
| `omnave-primary` | `#6949a8` | Header BG, active cards, CTAs, primary accents, progress bars |
| `omnave-primaryHover` | `#563b8c` | Hover state for primary buttons/links |
| `omnave-primary/10` | `rgba(105,73,168, 0.10)` | Pill badges, tinted pill backgrounds |
| `omnave-primary/20` | `rgba(105,73,168, 0.20)` | Loading skeletons, light tinted fills |

### 1.2 Canvas & Surfaces

| Token | Value | Usage |
|---|---|---|
| `omnave-canvas` | `#FFFFFF` | Root page background (CSS var, light mode default) |
| `omnave-surface` | `#FFFFFF` | Bento card backgrounds (CSS var) |
| `omnave-surface-secondary` | `#FFFFFF` | Secondary surface areas |
| Overlay Tint (Light) | `rgba(0,0,0,0.02)` — `bg-black/[0.02]` | Subtle inset areas inside white cards |
| Overlay Tint (Lighter) | `rgba(0,0,0,0.01)` — `bg-black/[0.01]` | Hover/background fills inside list items |

### 1.3 Text Colors

| Token | Value | Usage |
|---|---|---|
| `omnave-primary-text` | `#000000` | Primary text (headings, bold labels) |
| `omnave-secondary-text` | `#525252` | Secondary descriptions, metadata |
| `omnave-muted-text` | `#808080` | Muted / disabled / placeholder text |
| White on Purple | `#FFFFFF` | All text placed ON the `#6949a8` purple background |
| Sub-label on Purple | `text-white/80` = `rgba(255,255,255,0.80)` | Sub-labels on purple background cards |

### 1.4 Borders & Dividers

| Token | Value | Usage |
|---|---|---|
| `omnave-border` | `#EBEBEB` | Default card border, list separators, progress track |
| `omnave-border-hover` | `#D8D8D8` | Hover state for interactive borders |

### 1.5 Semantic & Accent Colors

| Token | Value | Usage |
|---|---|---|
| `omnave-success` | `#00d047` | Success indicator, unread notification dot |
| `omnave-streak` | `#F97316` | Reserved for high-streak flame accent scenarios |
| XP Gradient End | `#86d1ff` | Gradient terminus for XP bars and progress fills |
| XP / Progress Gradient | `from-[#6949a8] to-[#86d1ff]` | Applied to ALL progress bars via `bg-gradient-to-r` |

### 1.6 External Pages (Landing / Dark) — NOT ODL

These values exist in the Landing page (`/app/page.tsx`) only and are outside the ODL app design:

| Usage | Value |
|---|---|
| Dark canvas | `#0A0A0A` |
| Dark card surface | `#130E24` |

---

## 2. Typography

**Font:** `Poppins` only. No mixing with system fonts or other Google Fonts.
**Class Prefix:** `font-poppins` (CSS variable: `--font-poppins`)

### 2.1 Type Scale

| Role | Class | Size | Line Height | Weight | Usage |
|---|---|---|---|---|---|
| Page Title / Section Title | `text-[18px] leading-[27px] font-semibold` | 18px | 27px | 600 | Header greeting, "Up Next" section title |
| Card Hero Value (Large) | `text-3xl font-bold leading-none` | 30px | 1 | 700 | Level number, streak count |
| Body Label / Card Subtitle | `text-[13px] leading-[20px] font-normal` | 13px | 20px | 400 | Card sub-labels on purple BG |
| Eyebrow / Overline Label | `text-[10px] font-bold tracking-[0.2em] uppercase` | 10px | auto | 700 | Section headers ("LEVEL", "STREAK") |
| Mini Label (Tiny) | `text-[9px] font-bold` | 9px | auto | 700 | Sub-labels below stats (XP counts) |
| Card Body | `text-xs font-bold tracking-tight` | 12px | auto | 700 | Material card titles |
| Caption / Timestamp | `text-[10px] font-normal` | 10px | auto | 400 | Card metadata (card count, %) |
| Date Label | `text-[12px] uppercase tracking-wider` | 12px | auto | 400 | Header date line |
| Section Nav Link | `text-[11px] font-bold uppercase tracking-[0.05em]` | 11px | auto | 700 | "View All" link |
| Button Text (Primary CTA) | `text-[13px] leading-[20px] font-semibold` | 13px | 20px | 600 | CTA button text on purple card |
| Nav Label | `text-[11px] font-medium tracking-wide` | 11px | auto | 500 | Bottom nav labels |

All text must use `font-poppins` class explicitly.

---

## 3. Spacing Scale

Only these spacing values may be used. Do not introduce arbitrary spacing.

| Token | Value | Usage |
|---|---|---|
| Screen Horizontal Padding | `px-[25px]` | All page wrappers |
| Card Padding | `p-[20px]` | All bento cards |
| Section Gap | `gap-[20px]` | Space between stacked sections |
| Card Internal Gap (Large) | `gap-5` | Internal sections inside a card |
| Card Internal Gap (Small) | `gap-[10px]` or `gap-3` | Within card header rows |
| List Item Gap | `space-y-3` or `gap-3` | Between list items |
| Bottom Padding (Nav) | `pb-[120px]` | Page bottom scroll buffer for BottomNav |
| Canvas Top Offset | `-mt-12` | White canvas overlapping the purple header |
| Canvas Rounding | `rounded-t-[40px]` | Top rounding of white canvas |
| Card Max Width | `max-w-5xl` | All page content containers |

---

## 4. Border Radii

| Token | Value | Usage |
|---|---|---|
| Bento Card Radius | `rounded-[15px]` | All standard cards and card-like elements |
| Mini Card Radius | `rounded-lg` (8px) | Icon containers inside cards |
| Button / CTA Radius | `rounded-full` | All CTA buttons, pills, icon buttons |
| Progress Bar Track | `rounded-full` | XP and progress bar containers |
| Canvas Curve (Top) | `rounded-t-[40px]` | Top of the white canvas region |
| Goal Checkbox | `rounded-full` | Circular completion indicator |
| Notification Popover | `rounded-[15px]` | Dropdown panels |

---

## 5. Elevation & Shadows

Two shadow values only. Do not invent new ones.

| Token | Value | Usage |
|---|---|---|
| Standard Card Shadow | `shadow-[0px_10px_10px_rgba(0,0,0,0.09)]` | All standard bento cards (white surface) |
| Hero Card Shadow | `shadow-[0px_10px_20px_rgba(0,0,0,0.09)]` | Prominent cards (AI card, Up Next card) |
| Active Tab Glow | `drop-shadow-[0px_10px_10px_#e9deff]` | Active BottomNav item |
| Pull-to-Refresh Bubble | `shadow-[0px_4px_10px_rgba(0,0,0,0.15)]` | Floating circular PTR indicator |
| CSS Var Glass Shadow | `shadow-premium-glass` = `0px 10px 10px rgba(0,0,0,0.09)` | Header action buttons |

---

## 6. Animation & Motion

All interactive animations must use **Framer Motion** with exact parameters.

### 6.1 Spring Transition (Standard)
```ts
const springTransition = { type: "spring", stiffness: 400, damping: 25 };
// Interactive cards:       whileTap={{ scale: 0.95 }}
// Small list items:        whileTap={{ scale: 0.98 }}
// Icon buttons (header):   whileTap={{ scale: 0.90 }}
```

### 6.2 Card Entry Transition
```ts
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### 6.3 Notification Popover
```ts
initial={{ opacity: 0, y: -10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -10, scale: 0.95 }}
transition={{ type: "spring", damping: 20, stiffness: 300 }}
```

### 6.4 CSS Transition (Non-Framer)
- Color / border: `transition-colors duration-200`
- All properties: `transition-all duration-200`
- Progress bar fill: `transition-all duration-300`
- Theme change: `transition: background-color 0.3s ease, color 0.3s ease`

---

## 7. Layout System & PWA Structure

### 7.1 Home Page Layout (Canonical)

```
<main>                                                  ← bg-[#6949a8], full screen, pt-safe-area
  <Header />                                            ← bg-[#6949a8], greeting + action buttons
  <div> rounded-t-[40px] bg-white -mt-12 z-20          ← THE WHITE CANVAS with 40px curve
    max-w-5xl mx-auto px-[25px] pt-8 pb-[120px]
    flex flex-col gap-[20px]                            ← Stacked sections with 20px gap
      <TodaysGoal />
      <UpNextCard />
      <ProgressMiniGrid />
      <OmnaveAICard />
      <DailyGoalsCard />
      <RecentMaterialsCard />
  </div>
</main>
```

### 7.2 PWA Safe Area Handling

| Element | Class |
|---|---|
| `<main>` top | `pt-[env(safe-area-inset-top)]` |
| `<main>` bottom | `pb-[env(safe-area-inset-bottom)]` |
| BottomNav | `pb-[env(safe-area-inset-bottom)]` |
| Overscroll Lock | `overscroll-behavior-y: none` via `@media (display-mode: standalone)` |

### 7.3 Scroll Architecture

| Layer | Behavior |
|---|---|
| `html`, `body` | `overflow-y: auto`, scrollbars hidden globally |
| PWA Standalone | `overscroll-behavior-y: none` |
| Horizontal carousels | `overflow-x: auto`, `snap-x`, `scrollbar-hide` |
| Pull-to-Refresh | Dampened by `Math.pow(diff, 0.85)`, threshold 60px |

---

## 8. Icon System

Library: **Lucide React** only.

| Context | Size | Stroke Width |
|---|---|---|
| BottomNav icons | 24px | 2 |
| Header action icons | 20px | default |
| Card icons (primary) | 18px | 2 |
| Small card icons | 16px | 1.5 |
| Progress check | 12px | 3 |
| Watermark / ambient | 120px | 0.75 |
| Section link arrow | 12px | 2 |

---

## 9. Loading State Pattern

Skeletons mirror exact height and radius of the real component with `animate-pulse`.

```tsx
// White card skeleton:
<div className="w-full bg-[#FFFFFF] rounded-[15px] p-5 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] animate-pulse min-h-[80px]" />

// Purple card skeleton:
<div className="w-full h-[90px] bg-[#6949a8]/20 rounded-[15px] shadow-[0px_10px_20px_rgba(0,0,0,0.09)] animate-pulse" />
```

---

## 10. Figma-Level Annotations (from source comments)

| Element | Figma Spec |
|---|---|
| Section title (Up Next) | `font-medium text-[18px] leading-[27px]` — NOT uppercase |
| Card primary label | `font-semibold text-[18px] leading-[27px]` |
| Card sub-label | `font-normal text-[13px] leading-[20px]` |
| Today's Goal ring | 60×60px SVG, r=25, strokeWidth=4, fill `#6949a8`, track `#EBEBEB` |
| Eyebrow labels | `font-bold text-[10px] tracking-[0.2em] uppercase` |
| XP / progress bar | `h-[2px]`, `bg-gradient-to-r from-[#6949a8] to-[#86d1ff]` |
| Completion badge | `text-[10px] font-semibold text-[#6949a8] bg-[#6949a8]/10 px-2 py-0.5 rounded-full` |
