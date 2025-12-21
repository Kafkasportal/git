# Palette's Journal

## 2024-05-22 - Shadcn Button Composition
**Learning:** The default Shadcn `Button` component with `asChild` creates a potential issue where `isLoading` spinner is injected as a sibling to the child component inside a `Slot`. `Slot` from Radix UI expects a single child and merges props. If `Button` renders `{isLoading && <Loader />} {children}`, and `children` is the Slot's content, this creates two children when `isLoading` is true, which might cause the Slot to fail or render unexpectedly.
**Action:** When using `asChild`, either ensure `isLoading` is not used or refactor the Button component to handle this case safely (e.g., wrap in a fragment or handle loading externally). Ideally, `asChild` should disable internal loading UI or use a different composition strategy.
