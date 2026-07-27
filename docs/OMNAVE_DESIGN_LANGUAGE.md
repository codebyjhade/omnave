# Omnave Design Language (ODL)

This document contains the strict rulebook and design tokens mapping our "Friendly EdTech" philosophy to our Tailwind & Framer Motion stack.

## 1. Design Tokens

### Typography
- **Font Family:** `Poppins` (via next/font/google)
- **Heading Weights:** SemiBold (600)
- **Body/Card Weights:** Medium (500)

### Colors
- **Canvas / Background:** `#FFFFFF` (Pure white)
- **Borders / Dividers / Neutral Light:** `#EBEBEB`
- **Primary Accent:** `#6949a8`
- **Primary Text:** `#000000`
- **Secondary / Muted Text:** `#525252`
- **Success State:** `#00d047`
- **Quiz Gradient End:** `#86d1ff`

### Radii
- **Standard Bento Cards:** `rounded-[15px]` (15px border radius)
- **Interactive Buttons / Pills:** `rounded-full` (40px–50px)

### Spacing
- **Card Padding:** `20px` (Tailwind `p-5`)
- **Screen Padding X:** `25px` (Tailwind `px-[25px]`)

### Elevation & Shadows
- **Card Shadow:** `0px 10px 10px rgba(0, 0, 0, 0.09)` (custom shadow)
- **Active Tab Glow:** `0px 10px 10px #e9deff`

---

## 2. Animation Physics (Framer Motion)

To maintain a responsive, springy, and premium EdTech feel, all animations must follow these strict settings:

- **Button Taps:**
  `whileTap={{ scale: 0.95 }}` with a spring transition:
  `transition={{ type: "spring", stiffness: 400, damping: 25 }}`

- **Page / Card Transitions:**
  Smooth vertical fade-in:
  `initial={{ opacity: 0, y: 10 }}`
  `animate={{ opacity: 1, y: 0 }}`
  `transition={{ type: "spring", stiffness: 300, damping: 30 }}`
