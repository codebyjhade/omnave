import type { Config } from "tailwindcss";

// ─────────────────────────────────────────────────────────────────
//  OMNAVE DESIGN SYSTEM — tailwind.config.ts
//  Version 2.0 | Source: Home Dashboard design audit
//
//  RULE: Every value here was extracted from /app/home/page.tsx and
//  its direct component imports. Do NOT add arbitrary values outside
//  these tokens. If a new token is needed, add it here first.
// ─────────────────────────────────────────────────────────────────

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── COLORS ───────────────────────────────────────────────────
      colors: {
        omnave: {
          // CSS-var driven — flips automatically between dark/light themes
          canvas:          "var(--omnave-canvas)",
          surface:         "var(--omnave-surface)",
          surfaceSecondary:"var(--omnave-surface-secondary)",

          // Primary brand purple — NEVER substitute
          primary:         "#6949a8",
          primaryHover:    "#563b8c",

          // Semantic tokens
          border:          "var(--omnave-border)",       // #EBEBEB
          borderHover:     "var(--omnave-border-hover)", // #D8D8D8
          success:         "#00d047",  // Notification dot, success states
          streak:          "#F97316",  // High-streak flame accent

          // XP gradient end — always paired with primary in bg-gradient-to-r
          xpEnd:           "#86d1ff",
        }
      },

      // ── TEXT COLORS ───────────────────────────────────────────────
      textColor: {
        "omnave-primary-text":   "var(--omnave-text-primary)",   // #000000
        "omnave-secondary-text": "var(--omnave-text-secondary)", // #525252
        "omnave-muted-text":     "var(--omnave-text-muted)",     // #808080
      },

      // ── SHADOWS ───────────────────────────────────────────────────
      boxShadow: {
        // Standard white bento card shadow
        "card":         "0px 10px 10px rgba(0, 0, 0, 0.09)",
        // Hero card shadow (AI card, Up Next card)
        "card-hero":    "0px 10px 20px rgba(0, 0, 0, 0.09)",
        // BottomNav separator shadow
        "nav-top":      "0px -4px 10px rgba(0, 0, 0, 0.05)",
        // Pull-to-refresh floating bubble
        "ptr":          "0px 4px 10px rgba(0, 0, 0, 0.15)",
        // CSS-var driven (used by header buttons)
        "premium-glass": "var(--omnave-shadow-glass)",
        "premium-inner": "var(--omnave-shadow-inner)",
        // Legacy alias
        "elevation":     "var(--omnave-shadow-glass)",
      },

      // ── DROP SHADOWS ──────────────────────────────────────────────
      dropShadow: {
        // Active BottomNav tab purple glow
        "nav-active": "0px 10px 10px #e9deff",
      },

      // ── BORDER RADIUS ─────────────────────────────────────────────
      borderRadius: {
        // Standard bento card radius — THE primary radius token
        "bento":   "15px",
        // Canvas top curve (the white canvas ramp)
        "canvas":  "40px",
        // Icon containers inside cards
        "icon":    "8px",
      },

      // ── SPACING ───────────────────────────────────────────────────
      spacing: {
        // Screen horizontal padding
        "screen-x": "25px",
        // Standard card padding
        "card":      "20px",
        // Section gap (gap between vertical sections on Home)
        "section":   "20px",
        // Bottom nav scroll clearance
        "nav-clear": "120px",
        // Canvas top overlap (negative margin)
        // Note: Use -mt-12 (Tailwind built-in), not a custom value
      },

      // ── FONT FAMILY ───────────────────────────────────────────────
      fontFamily: {
        // Poppins is the ONLY allowed font family
        poppins: ["var(--font-poppins)", "sans-serif"],
        sans:    ["var(--font-poppins)", "sans-serif"],
      },

      // ── FONT SIZE ─────────────────────────────────────────────────
      fontSize: {
        // Eyebrow / overline labels
        "eyebrow":  ["10px", { lineHeight: "auto", fontWeight: "700", letterSpacing: "0.2em" }],
        // Mini labels (XP counts, sub-stats)
        "mini":     ["9px",  { lineHeight: "auto", fontWeight: "700" }],
        // Caption / timestamps
        "caption":  ["10px", { lineHeight: "auto", fontWeight: "400" }],
        // Card section nav link
        "nav-link": ["11px", { lineHeight: "auto", fontWeight: "700", letterSpacing: "0.05em" }],
        // Bottom nav tab label
        "nav-tab":  ["11px", { lineHeight: "auto", fontWeight: "500" }],
        // Card subtitle on purple backgrounds
        "card-sub": ["13px", { lineHeight: "20px", fontWeight: "400" }],
        // Section title / primary label
        "section-title": ["18px", { lineHeight: "27px", fontWeight: "600" }],
      },

      // ── ANIMATION ─────────────────────────────────────────────────
      // Note: All spring animations are done via Framer Motion, not CSS.
      // These CSS-only keyframes are for shimmer and gradient animations.
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "svg-trace": {
          "0%":   { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        shimmer:    "shimmer 2s infinite",
        "svg-trace":"svg-trace 2s ease forwards",
      },
    },
  },
  plugins: [],
};
export default config;
