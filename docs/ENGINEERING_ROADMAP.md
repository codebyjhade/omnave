# Omnave Engineering Roadmap & Technical Implementation

## Overview
This document outlines the technical strategy and build phases for the Omnave platform. Development must strictly adhere to the Omnave Design Language (ODL). Engineering efforts must prioritize UI stability, component reusability, and clean data architecture over rushed feature shipping.

---

## 1. Technology Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS (Strictly bound to `DESIGN_SYSTEM.md` tokens)
*   **Language:** TypeScript (Strict typing for all data models)
*   **State Management:** React Context API (`UserContext`, `ProgressStats`)
*   **Database/Auth:** (e.g., Firebase / Supabase)

---

## 2. Engineering Guardrails (Agent Directives)
When writing or refactoring code, the engineering agent must obey these rules:
1.  **Component Isolation:** Never build massive, monolithic files. Break complex interfaces (like the 12-column Progress Grid) into smaller, manageable server and client components.
2.  **Strict Wrapper Protection:** Do not modify the outermost global `<main>` and `<header>` tags of a page once they are mathematically locked. Only target the content containers below them.
3.  **Zero Layout Shift:** UI components must reserve their space. Loading states must use skeleton screens that perfectly match the dimensions of the final loaded cards.
4.  **No Rogue CSS:** Do not invent new Tailwind arbitrary values (e.g., `bg-[#2a2a2a]`). Strictly use the established neutral scale (`bg-[#111111]`, `bg-[#151515]`, etc.) defined in the Design System.

---

## 3. Development Phases

### Phase 1: Foundation & Architecture
*Goal: Establish the unbreakable structural skeleton.*
*   Initialize Next.js App Router structure (`app/home`, `app/library`, `app/progress`, `app/profile`).
*   Configure Tailwind with the Omnave color palette and typography tokens.
*   Build the global Navigation bar and secure the math-perfect `<main>` page wrappers across all routes.

### Phase 2: The UI/UX System (Static Front-End)
*Goal: Build the Editorial AI Workspace visually before connecting data.*
*   Develop the primitive UI components: Bento Cards, Razor-thin Progress Bars, Frosted Glass (AI Insights) containers, and Typography headers.
*   Implement the 12-column dynamic CSS Grid for the Progress page.
*   Implement the uniform grid layout for the Library page.
*   Apply the "Intelligent Motion" rules (smooth color/border transitions on hover, strictly zero bounce or scale effects).

### Phase 3: Core Logic & Data Integration
*Goal: Bring the static UI to life with real user data.*
*   Establish the `UserContext` provider to wrap the application.
*   Build the backend data schemas based on `PRODUCT_SPEC.md`.
*   Connect the UI widgets (Heatmap, Quiz Performance, Level/XP) to the database.
*   Implement the Leitner System logic for Flashcard sorting and interval spacing.

### Phase 4: The AI Layer
*Goal: Integrate the silent, intelligent companion.*
*   Connect the LLM API to process uploaded documents into structured JSON (quizzes, summaries, flashcards).
*   Build the analytics engine to parse user performance and generate 1-2 sentence contextual insights.
*   Ensure AI outputs strictly map to the UI boundaries without breaking card heights or layouts.

### Phase 5: Polish & Performance
*Goal: Ensure the application feels like a premium, Tier-1 SaaS product.*
*   Conduct a full audit for layout shifts across desktop, tablet, and mobile breakpoints.
*   Optimize database queries and implement caching so the dashboard loads instantly.
*   Finalize empty states (what a page looks like before a user has data) ensuring they still feel designed and purposeful.