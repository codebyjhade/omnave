# Omnave Layout Guidelines — Grid & Composition

## Overview
This document defines how pages are structured spatially. Consistency in Omnave comes from the mathematical layout system, not from making every component identical.

## Bento Grid Philosophy
Omnave uses a flexible CSS Grid (typically 12-column) to distribute visual weight. The grid provides the mathematical foundation, but the composition must feel fluid and editorial.

*   **Hero Spans:** High-priority information must span larger areas (e.g., crossing 8 columns and 2 rows).
*   **Compact Spans:** Secondary information or quick actions occupy smaller spaces (e.g., 4 columns).
*   **Full-Width Stretches:** Contextual or timeline-based data (AI Insights, Activity Logs) stretch across the entire grid to break up vertical rhythm and provide breathing room.

## Page Skeletons & Safe Areas
To ensure zero layout shift when navigating between routes, every main view must share an identical, mathematical outer wrapper.

*   **Global Wrapper Constraints:** Max-width enforcement, symmetrical horizontal padding, and consistent top padding underneath the navigation bar.
*   **Header Locking:** Page titles and signposts are baseline-locked. The bounding box of the header must remain mathematically identical regardless of the page content.