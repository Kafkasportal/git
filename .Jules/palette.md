## 2025-05-15 - Missing TooltipProvider
**Learning:** The `Tooltip` component from Shadcn/Radix requires a `TooltipProvider` ancestor. This was missing from the global `Providers` component, preventing tooltips from working correctly in isolated components without local wrapping.
**Action:** Always ensure `TooltipProvider` is present in the application root (e.g., `src/app/providers.tsx`) before implementing tooltips in leaf components.
