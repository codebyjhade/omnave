# Omnave Design Tokens — Implementation Values

## Overview
This document owns every implementation value for the Omnave Design Language (ODL). It maps the abstract design system to exact Tailwind CSS utilities. Do not invent arbitrary values outside of this list.

## 1. Color Palette
*   **App Background:** `bg-[#09090b]`
*   **Standard Surface (Bento Base):** `bg-[#111111]`
*   **Hovered Surface:** `hover:bg-[#151515]`
*   **Primary Accent (ODL Purple):** `purple-500`
*   **Primary Text:** `text-white`
*   **Secondary Text:** `text-zinc-400`
*   **Tertiary/Muted Elements:** `text-zinc-500`

## 2. Geometry & Borders
*   **Corner Radius (Large):** `rounded-3xl`
*   **Standard Border:** `border border-white/[0.06]`
*   **Top-Edge Lighting:** `border-t-white/[0.12]`

## 3. Typography Rules
*   **Signposts / Eyebrows:** `text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase`
*   **Page Titles:** `text-3xl font-bold tracking-tight text-white leading-none`
*   **Data Metrics:** `text-3xl font-semibold tracking-tight text-white`

## 4. Effects & Motion
*   **Intelligent Hover (Cards):** `transition-all duration-500 ease-out hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]`
*   **Glassmorphism Base:** `bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-inner`
*   **Data Visualizer Thickness:** `h-[2px]` (Horizontal), `w-[2px]` (Vertical)