# Omnave Page Guidelines & Layout Hierarchy

## Overview
This document outlines the strict structural composition for Omnave's primary routes. Every page must adhere to the **Editorial AI Workspace** philosophy: establish a clear visual hierarchy, utilize intentional asymmetry (where appropriate), and answer the user's immediate questions without overwhelming them.

---

## 1. The Home Page (Learning Workspace)
The Home page is not a generic dashboard; it is the user's active workspace. It must feel composed, intentional, and calming.

*   **Primary Focal Point:** "What should I continue?" A dominant hero section highlighting the user's active, in-progress learning module.
*   **Secondary Focal Point:** "What does AI recommend?" A frosted-glass context card offering a personalized, actionable insight based on recent behavior.
*   **Supporting Sections:** "What have I recently worked on?" Compact, horizontal rows or split cards detailing recent study sessions or upcoming goals.
*   **Layout Rule:** Do not dump unprioritized metrics here. Reserve deep analytics for the Progress page.

---

## 2. The Library (Knowledge Vault)
Unlike the asymmetric analytics dashboards, the Library requires uniformity. It is a utility for scanning, searching, and managing knowledge.

*   **Header Structure:** Must include the standard mathematical header (`min-h-[32px]` title flexbox) alongside a minimal search bar and category pills (All, Recent, Ready, In Progress, Completed).
*   **Featured Kit:** The top-most item should be a slightly emphasized "Featured" or "Continue Learning" block to catch immediate attention.
*   **Grid Uniformity:** Study kits and documents must follow a uniform, repetitive grid (e.g., standard 3-column or 4-column cards). The predictability of this grid allows the user's eyes to easily scan titles and progress metrics.
*   **Card Anatomy:** Use sleek typography for document titles, muted icons for file types, and razor-thin `h-[2px]` bars for completion status.

---

## 3. The Progress Page (Analytics)
This page visualizes the user's learning journey using a dynamic, 12-column Bento Grid. It must feel highly dense and engineered, yet perfectly organized through asymmetric card spans.

*   **Grid Blueprint:** Use a flexible CSS Grid (`grid-cols-12`). Components must vary in width and height based on priority.
*   **Hero Card (`col-span-8 row-span-2`):** Reserved for the *Learning Overview* (Current Level, Streak, Total Study Days). This must visually dominate the top fold.
*   **Tall Card (`col-span-4 row-span-2`):** Reserved for linear, list-based content like *Daily Goals* or task checklists.
*   **Wide Cards (`col-span-8`):** Reserved for horizontal data visualizations, such as the *Weekly Activity Heatmap*.
*   **Standard Cards (`col-span-4`):** Used for supporting metrics (*Quiz Performance*, *Memory Retention*, *Flashcard Analytics*).
*   **Full-Width Context:** Use full-width (`w-full`) horizontal sections at the bottom for timeline-based or immersive content (*AI Insights*, *Recent Activity Log*, *Achievements*).

---

## 4. The Profile Page (Account)
The Profile page balances personal identity with overarching platform metrics. It must feel like a premium SaaS settings environment.

*   **Avatar & Identity:** The user avatar must avoid looking like a flat placeholder. Utilize the premium emissive gradient (`bg-gradient-to-br border shadow`) to give the profile picture depth.
*   **Stat Alignment:** High-level metrics (Level, Streak, Study Hours) must use sleek, editorial typography (`text-3xl font-semibold tracking-tight text-white`). Avoid heavy, chunky font weights.
*   **Badges & Unlocks:** Emphasize rare achievements or specific learning statuses (e.g., "Learner Backburner") using the *Selective Glassmorphism* token (`bg-white/[0.03] backdrop-blur-md`).