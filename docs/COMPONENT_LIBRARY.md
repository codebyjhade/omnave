# Omnave Component Library (OCL)
**Version 2.0 — Extracted from Home Dashboard & Core Components**
> Every component documented here is a direct extraction from existing source code. New components must feel identical to these established patterns.

---

## 1. Page Shell Components

### 1.1 `<Header />` — Purple Greeting Bar
**File:** `components/Header.tsx`

The purple brand header at the top of the Home Dashboard.

```tsx
// Structure:
<header className="w-full bg-[#6949a8] pt-7 pb-23 relative">
  <div className="max-w-5xl mx-auto px-[25px] flex justify-between items-center gap-4 select-none relative z-30">
    // Left: h1 greeting (text-[18px] font-semibold) + p date (text-[12px] uppercase tracking-wider)
    // Right: white circle buttons (Bell + Settings, each w-10 h-10 rounded-full bg-white text-[#6949a8])
  </div>
</header>
```

**Rules:**
- Always `bg-[#6949a8]`
- Greeting: `text-[18px] leading-[27px] font-poppins font-semibold text-white`
- Date: `text-white/80 font-poppins text-[12px] uppercase tracking-wider`
- Action buttons: `bg-white text-[#6949a8] p-2 rounded-full h-10 w-10 shadow-premium-glass`

---

### 1.2 `<BottomNav />` — Global Dock
**File:** `components/BottomNav.tsx`

Five tabs: Home, Lesson (Library), Upload, Progress, Profile.

```
Container:
  fixed bottom-0 left-0 w-full z-50
  bg-white border-t border-gray-100
  flex items-start justify-center
  pb-[env(safe-area-inset-bottom)]
  shadow-[0px_-4px_10px_rgba(0,0,0,0.05)]

NavItem (active):
  bg-[#6949a8] text-[#FFFFFF]
  drop-shadow-[0px_10px_10px_#e9deff]
  flex flex-col items-center pt-3 pb-4 px-4

NavItem (inactive):
  bg-transparent text-[#a0a0a0] hover:text-[#6949a8]
  transition-all duration-200

NavItem icon: size={24} strokeWidth={2}
NavItem label: text-[11px] font-medium font-poppins tracking-wide
```

**Rules:**
- Rendered via `createPortal` directly into `document.body`
- Hidden on `/`, `/welcome`, `/lesson/*`
- Tap: `whileTap={{ scale: 0.95 }}` spring

---

### 1.3 White Canvas Wrapper
The `<div>` that wraps all page content below the Header.

```tsx
<div className="flex-1 w-full max-w-5xl mx-auto px-[25px] pt-8 pb-[120px] rounded-t-[40px] flex flex-col gap-[20px] bg-[#FFFFFF] -mt-12 relative z-20">
  {/* All sections go here */}
</div>
```

**Rules:**
- NEVER change `rounded-t-[40px]`, `bg-[#FFFFFF]`, `-mt-12`, `z-20`
- `gap-[20px]` between ALL direct children sections
- `pb-[120px]` for BottomNav clearance

---

## 2. Card Components

### 2.1 Standard White Bento Card
The most fundamental card. Used for: Daily Goals, Recent Materials, Level/Streak.

```tsx
<div className="w-full bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-5">
  {/* Section Header Row */}
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase font-poppins">
      Section Name
    </span>
    {/* Optional "View All" link */}
    <Link className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6949a8] hover:text-[#563b8c] transition-colors uppercase tracking-[0.05em] font-poppins">
      View All <ArrowRight size={12} strokeWidth={2} />
    </Link>
  </div>
  {/* Content */}
</div>
```

### 2.2 Purple Hero Card — AI Recommendation
```tsx
<div className="w-full h-[167px] bg-[#6949a8] shadow-[0px_10px_20px_rgba(0,0,0,0.09)] rounded-[15px] p-[20px] flex flex-row justify-between items-center overflow-hidden relative">
  {/* Left: logo + title + description + CTA button */}
  <div className="flex flex-col items-start gap-[10px] z-10 w-[60%]">
    {/* Logo + title row */}
    <div className="flex items-center gap-3">
      <img src="/omnave.png" className="w-9 h-9 rounded-full" />
      <span className="text-white font-poppins font-semibold text-[18px] leading-[27px]">Omnave AI</span>
    </div>
    {/* Description */}
    <p className="text-white/80 font-poppins font-normal text-[12px] leading-[20px]">{text}</p>
    {/* CTA */}
    <motion.button className="bg-white text-[#6949a8] font-poppins font-semibold px-5 py-2.5 rounded-full text-[13px] leading-[20px] flex items-center gap-2">
      {label} <ArrowRight size={13} />
    </motion.button>
  </div>
  {/* Watermark sparkle */}
  <Sparkles size={120} strokeWidth={0.75} className="absolute top-1/2 -translate-y-1/2 -right-4 text-white opacity-10" />
</div>
```

### 2.3 Purple Navigation Card — Up Next
```tsx
<motion.div
  whileTap={{ scale: 0.95 }}
  transition={springTransition}
  className="w-full h-[90px] bg-[#6949a8] rounded-[15px] p-[20px] shadow-[0px_10px_20px_rgba(0,0,0,0.09)] flex flex-row items-center justify-between gap-4 cursor-pointer select-none"
>
  <div className="flex items-center gap-3 min-w-0 flex-1">
    {/* White circle icon */}
    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
      <BookOpen size={18} strokeWidth={2} className="text-[#6949a8]" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[#FFFFFF] font-poppins font-semibold text-[18px] leading-[27px] truncate">{title}</span>
      <span className="text-white/80 font-poppins font-normal text-[13px] leading-[20px]">{subtitle}</span>
    </div>
  </div>
  <ChevronRight size={20} strokeWidth={2} className="text-white shrink-0" />
</motion.div>
```

### 2.4 Mini Stat Card — Level / Streak
```tsx
<motion.div
  whileTap={{ scale: 0.95 }}
  transition={springTransition}
  className="bg-omnave-surface border-none rounded-[15px] p-[20px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col justify-between select-none cursor-pointer"
>
  <div>
    <span className="text-[10px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase block mb-1 font-poppins">LABEL</span>
    <span className="text-3xl font-bold tracking-tight text-omnave-primary-text leading-none font-poppins">{value}</span>
  </div>
  <div className="mt-2">
    <span className="text-[9px] font-bold text-omnave-secondary-text block font-poppins">{sublabel}</span>
    {/* Optional: XP bar */}
    <ProgressBar progress={pct} />
  </div>
</motion.div>
```

### 2.5 TodaysGoal Card
**File:** `components/TodaysGoal.tsx`

```tsx
// Container:
"w-full h-[100px] bg-[#FFFFFF] rounded-[15px] p-[20px] shadow-[0px_10px_20px_rgba(0,0,0,0.09)] flex flex-row items-center justify-between"

// Left:
<Image src="/target-icon.png" width={40} height={40} />
<span className="text-[#000000] font-poppins font-medium text-[18px] leading-[27px]">Today's Goal</span>
<span className="text-[#525252] font-poppins font-normal text-[13px] leading-[20px]">Complete 3 lessons + 1 quiz</span>

// Right: SVG ring (60×60, r=25, strokeWidth=4, color=#6949a8, track=#EBEBEB)
// Center text: text-[14px] font-poppins font-medium text-[#6949a8]
```

### 2.6 Goal List Item
```tsx
<motion.li
  whileTap={{ scale: 0.98 }}
  transition={springTransition}
  className="flex items-center gap-3 p-3 rounded-[15px] bg-black/[0.02] border border-omnave-border cursor-pointer select-none"
>
  {/* Circular checkbox: w-5 h-5 rounded-full border */}
  {/* Completed: bg-[#6949a8] border-[#6949a8] text-white */}
  {/* Incomplete: border-omnave-border bg-transparent hover:border-[#6949a8]/50 */}

  {/* Title: text-xs font-bold text-omnave-primary-text font-poppins */}
  {/* Description: text-[10px] text-omnave-secondary-text font-poppins */}
</motion.li>
```

### 2.7 Material Card (Scrollable carousel / Grid)
```tsx
<motion.div
  whileTap={{ scale: 0.95 }}
  transition={springTransition}
  className="min-w-[240px] sm:min-w-0 snap-start shrink-0 sm:shrink flex flex-col justify-between gap-4 p-4 bg-black/[0.01] border border-omnave-border rounded-[15px] group cursor-pointer select-none"
>
  <div className="flex items-start gap-3">
    {/* Icon container: w-8 h-8 rounded-lg bg-black/[0.03] border border-omnave-border */}
    {/* Title: text-xs font-bold tracking-tight text-omnave-primary-text group-hover:text-[#6949a8] */}
    {/* Count: text-[10px] text-omnave-secondary-text */}
  </div>
  {/* Progress bar + percent */}
</motion.div>
```

---

## 3. Progress Bar Component

Universal — used in Level Card, Material Cards, AI upload progress.

```tsx
// Track (always #EBEBEB or bg-omnave-border, h-[2px]):
<div className="w-full h-[2px] bg-omnave-border rounded-full overflow-hidden">
  {/* Fill (always the gradient): */}
  <div
    className="h-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
// Label:
<span className="text-[9px] text-omnave-secondary-text text-left font-medium font-poppins">
  {progress}% completed
</span>
```

---

## 4. Button Components

### 4.1 Primary CTA Button (White on Purple)
```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={springTransition}
  className="bg-white text-[#6949a8] font-poppins font-semibold px-5 py-2.5 rounded-full transition-all hover:bg-white/90 flex items-center gap-2 w-max shadow-sm cursor-pointer border-none"
>
  <span className="text-[13px] leading-[20px]">Label</span>
  <ArrowRight size={13} className="text-[#6949a8]" />
</motion.button>
```

### 4.2 Icon Button (Header Actions)
```tsx
<motion.button
  whileTap={{ scale: 0.90 }}
  className="bg-white text-[#6949a8] p-2 rounded-full h-10 w-10 flex items-center justify-center cursor-pointer shadow-premium-glass border-none"
>
  <Bell size={20} />
</motion.button>
```

### 4.3 Completion Badge / Status Pill
```tsx
<span className="text-[10px] font-semibold text-[#6949a8] bg-[#6949a8]/10 px-2 py-0.5 rounded-full font-poppins">
  2/3 Done
</span>
```

---

## 5. Notification Popover

```tsx
<motion.div
  initial={{ opacity: 0, y: -10, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -10, scale: 0.95 }}
  transition={{ type: "spring", damping: 20, stiffness: 300 }}
  className="absolute top-12 right-0 w-[calc(100vw-2rem)] sm:w-80 rounded-[15px] bg-white border-none shadow-[0px_10px_10px_rgba(0,0,0,0.09)] overflow-hidden z-[9999]"
>
  {/* Header bar: border-b border-[#EBEBEB] bg-black/[0.01] */}
  {/* Notification item: p-4 flex gap-3.5 hover:bg-black/[0.01] divide-y divide-[#EBEBEB] */}
  {/* Unread item: bg-[#6949a8]/[0.02] */}
</motion.div>
```

---

## 6. Pull-to-Refresh Indicator

```tsx
// Container: fixed left-0 right-0 z-[9999] flex justify-center pointer-events-none
// Trigger: top: 'calc(env(safe-area-inset-top) + 20px)'
// Bubble: bg-white rounded-full p-2.5 shadow-[0px_4px_10px_rgba(0,0,0,0.15)] w-10 h-10 border border-[#EBEBEB]
// Icon: stroke="#6949a8" strokeWidth="3", animate-spin when refreshing
// Drag rotation: rotate(${pullDistance * 4}deg), dampened threshold 60px
```

---

## 7. Section Patterns

### 7.1 Eyebrow Section Header (Standalone)
Used at top of page sections (not inside a card):
```tsx
<h2 className="text-[#000000] font-poppins font-medium text-[18px] leading-[27px] mb-[10px]">
  Section Title
</h2>
```

### 7.2 Card Section Header Row
Used inside white cards to label a data section:
```tsx
<div className="flex items-center justify-between mb-4">
  <span className="text-[11px] font-bold tracking-[0.2em] text-omnave-secondary-text uppercase font-poppins">
    Label
  </span>
  <Link href="/" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6949a8] hover:text-[#563b8c] transition-colors uppercase tracking-[0.05em] select-none font-poppins">
    <span>View All</span>
    <ArrowRight size={12} strokeWidth={2} />
  </Link>
</div>
```

### 7.3 Empty State (Inside Card)
```tsx
<div className="py-6 text-center text-xs text-omnave-secondary-text font-medium border border-dashed border-omnave-border rounded-[15px] bg-black/[0.01] font-poppins">
  No study materials found. Upload your first document to populate your library.
</div>
```

### 7.4 Horizontal Scroll Carousel
```tsx
<div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-x-visible gap-4 pb-2 sm:pb-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
  {items.map(item => <MaterialCard key={item.id} {...item} />)}
</div>
```

---

## 8. Skeleton Loading Variants

Always match the real component height and radius:

```tsx
// TodaysGoal:  min-h-[80px]  → h-[100px] white card
// Up Next:     h-[90px]      → purple/20 tint  
// Progress Grid: grid cols-2 gap-[20px], each min-h-[110px]
// AI Card:     h-[167px]     → purple/20 tint
// Goals Card:  min-h-[220px] → white card with inner rows
// Materials:   min-h-[160px] → white card
```

All: `animate-pulse`, same `rounded-[15px]`, same `shadow-*`.

---

## 9. Constants Reference

```ts
// Spring transition (copy-paste everywhere):
const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

// Card entry animation:
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Pull-to-refresh dampen formula:
const dampenedDiff = Math.min(120, Math.pow(diff, 0.85));
// Threshold: 60px

// Progress bar gradient:
"bg-gradient-to-r from-[#6949a8] to-[#86d1ff]"
```
