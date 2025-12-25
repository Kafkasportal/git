## 2024-05-23 - Icon-Only Button Accessibility
**Learning:** Many icon-only buttons use `Button` with `size="sm"` but lack `aria-label`, making them inaccessible.
**Action:** Replace these with `IconButton` component which enforces `label` prop and handles tooltips automatically.
