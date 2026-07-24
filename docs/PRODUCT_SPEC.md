# Omnave Product Specification — Features & Data Architecture

## Overview
This document defines the core functional requirements, feature sets, and data models that power the Omnave platform. It ensures that engineering implementation aligns with the Editorial AI Workspace identity by keeping features focused, intentional, and driven by actionable data.

---

## 1. Core Feature Sets

### A. The Knowledge Vault (Library)
The central repository for all user-imported and AI-generated study materials.
*   **Study Kits:** Grouped collections of related PDFs, notes, and media.
*   **Document Processing:** Users can upload documents (PDFs, text) which are parsed to generate structured data (summaries, flashcards, quizzes).
*   **Status Tracking:** Every item tracks its state: `Recent`, `Ready`, `In Progress`, or `Completed`.

### B. Intelligent Testing Engine
The system for evaluating user knowledge and memory retention.
*   **Practice Quizzes:** Dynamically generated multiple-choice and short-answer assessments based on study materials.
*   **Flashcards (Leitner System):** Spaced repetition flashcards categorized into distinct distribution boxes:
    *   *Box 1 (Learning):* Frequent review required.
    *   *Box 2 (Review):* Moderate interval.
    *   *Box 3 (Mastered):* Maximum interval spacing.
*   **Memory Decay Tracking:** Algorithms classify knowledge retention into three states: `Optimal (>80%)`, `Fading (50-80%)`, and `Critical (<50%)`.

### C. Workspace Analytics (Progress)
High-density data tracking to give users immediate feedback on their learning momentum.
*   **Global Level & XP:** Users earn XP for completing goals, quizzes, and maintaining streaks.
*   **Weekly Heatmap:** An 84-day (12-week) GitHub-style contribution grid tracking active study sessions.
*   **Time Tracking:** Aggregates total study hours and average session lengths.
*   **Daily Goals:** A checklist of auto-generated or user-defined daily tasks (e.g., "Complete a Quiz", "Maintain Streak").

---

## 2. AI Integration Strategy
AI in Omnave must act as a silent, intelligent companion. It analyzes data in the background and surfaces insights contextually.

*   **Contextual AI Insights:** The system analyzes the user's activity (e.g., low quiz scores on a specific subject, time of day studied) and generates 1-2 sentence actionable recommendations.
*   **Content Generation:** AI is utilized strictly to convert static user uploads into active learning tools (generating quiz questions and flashcards from raw text).
*   **Tone of Voice:** AI outputs must be concise, encouraging, and highly specific. No generic conversational filler.

---

## 3. Data Models & State Management

### A. User Object (`UserContext`)
*   `uid`: String
*   `name`: String
*   `joinDate`: Timestamp
*   `level`: Integer
*   `currentXP`: Integer
*   `xpToNextLevel`: Integer

### B. Progress Object (`ProgressStats`)
*   `currentStreak`: Integer (Days)
*   `longestStreak`: Integer (Days)
*   `totalStudyDays`: Integer
*   `overallCompletion`: Percentage (0-100)
*   `quizAverage`: Percentage (0-100)
*   `totalStudyTime`: Integer (Minutes)
*   `heatmapData`: Array of active session timestamps

### C. Achievement System
*   **Badges:** Unlockable icons representing specific milestones (e.g., "First Step: Upload a document", "Hyper-Focus: Review 100 flashcards").
*   **Rarity:** Badges are categorized by rarity (`Common`, `Rare`, `Epic`) to encourage long-term retention.