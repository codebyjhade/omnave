# Omnave Design System — Component Behavior

## Overview
This document defines the functional behavior of Omnave's components. It dictates how elements act, adapt, and communicate state. *Note: Implementation specifics and CSS classes belong in `DESIGN_TOKENS.md`.*

## Cards
Cards are the foundational building blocks of the workspace. They represent meaningful actions or insights.
*   **Behavior:** Cards must adapt to their content. Avoid fixed heights unless architecturally necessary.
*   **Whitespace:** Cards should feel lightweight and spacious. Whitespace is an active design element used to separate information, replacing the need for excessive line dividers.

## Selective Glassmorphism
Glass surfaces are reserved strictly for premium, intelligent, or elevated elements (e.g., AI Insights, unlocked achievements, context menus).
*   **The "Why":** Glass represents elevated intelligence and contextual guidance. It should never be decorative. Users should subconsciously associate glass surfaces with AI assistance or high-value platform feedback.

## Data Visualizations
Charts and progress indicators must feel highly engineered, precise, and minimal.
*   **Behavior:** Visualizations must be razor-thin and sleek. They communicate exact progress without adding visual bulk to the interface. Thick or chunky bars are strictly prohibited.

## Motion
Motion must be invisible, fast, smooth, and purposeful.
*   **Behavior:** Use subtle fades, gentle scaling, and polished color transitions. Motion communicates a change in state or focus.
*   **Restriction:** Decorative animations, bouncing, and layout-shifting transitions are forbidden. Motion must never attract attention for the sake of flair.