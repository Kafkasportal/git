# Palette Journal - Critical UX & Accessibility Learnings

## 2024-05-22 - Localization Consistency in UI Primitives
**Learning:** Found that base UI primitives (like Dialog) sometimes contain hardcoded English strings ("Close") even when the rest of the app is localized (Turkish). This creates an inconsistent experience for screen reader users.
**Action:** Always check `sr-only` text in shared components when working in a localized codebase, not just visible text.
