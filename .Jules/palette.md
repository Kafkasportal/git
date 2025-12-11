## 2025-12-11 - Pagination Accessibility
**Learning:** The `Pagination` component relied on `title` for icon-only buttons. While `title` provides a tooltip, it is not a reliable substitute for `aria-label` for screen readers.
**Action:** Always ensure `size="icon"` buttons and inputs without visible labels have an explicit `aria-label`, especially in navigation components.
