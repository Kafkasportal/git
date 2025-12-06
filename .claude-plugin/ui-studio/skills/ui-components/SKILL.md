---
name: UI Components
description: This skill should be used when the user asks to "create a component", "build a UI component", "generate a React component", "make a new component", "add a component", or mentions component types like "card", "button", "form", "input", "widget", "kpi card", "stat card", "dashboard widget". Provides comprehensive guidance for creating production-ready React components with TypeScript, Tailwind CSS, and modern best practices.
version: 1.0.0
---

Master the creation of production-ready React components with TypeScript, Tailwind CSS, and modern patterns. This skill provides comprehensive guidance for building scalable, accessible, and performant UI components.

## Core Principles

Build components following these essential principles:

### Composition Over Complexity
Structure components for reusability and maintainability. Break complex UIs into smaller, focused components. Use composition patterns to combine simple components into sophisticated interfaces.

### Type Safety First
Leverage TypeScript's type system comprehensively. Define explicit interfaces for props, use discriminated unions for variants, and ensure full type coverage. Type safety prevents runtime errors and improves developer experience.

### Accessibility by Default
Implement ARIA attributes, keyboard navigation, and semantic HTML from the start. Test with screen readers and keyboard-only navigation. Accessibility is not optional—it's fundamental.

### Performance Optimization
Apply React.memo for components that render frequently with identical props. Use useMemo and useCallback judiciously. Implement code splitting for large component libraries.

## Component Structure

### Functional Component Pattern

Use modern functional components with hooks:

```typescript
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  // Props interface
  title: string;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

function ComponentNameBase({
  title,
  variant = 'default',
  size = 'md',
  className,
  children,
}: ComponentNameProps) {
  return (
    <div className={cn('base-classes', className)}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export const ComponentName = memo(ComponentNameBase);
```

### Props Interface Design

Define clear, well-documented interfaces:

```typescript
interface ButtonProps {
  /** Button text content */
  children: React.ReactNode;

  /** Visual style variant */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost';

  /** Size preset */
  size?: 'sm' | 'md' | 'lg';

  /** Disable interaction */
  disabled?: boolean;

  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /** Additional CSS classes */
  className?: string;

  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
}
```

### Component Variants with CVA

Use class-variance-authority for maintainable variant systems:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant, size, className, children }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })}>
      {children}
    </button>
  );
}
```

## Common Component Patterns

### Card Components

Create flexible card components for content display:

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            'text-xs',
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Form Components

Build form components with validation support:

```typescript
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
            'text-sm ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### Icon Integration

Integrate Lucide React icons effectively:

```typescript
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function IconButton({ icon: Icon, label, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-accent"
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
```

## Radix UI Integration

Leverage Radix UI for accessible, unstyled components:

### Dialog Component

```typescript
import * as Dialog from '@radix-ui/react-dialog';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Dropdown Menu

```typescript
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function UserMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="px-4 py-2 rounded-lg border">
        Menu
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-background border rounded-lg shadow-lg p-1 min-w-[200px]">
          <DropdownMenu.Item className="px-3 py-2 text-sm rounded hover:bg-accent cursor-pointer outline-none">
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item className="px-3 py-2 text-sm rounded hover:bg-accent cursor-pointer outline-none">
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item className="px-3 py-2 text-sm rounded hover:bg-accent cursor-pointer outline-none text-destructive">
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

## Styling with Tailwind CSS

### Utility-First Approach

Combine Tailwind utilities for rapid development:

```typescript
<div className="flex items-center justify-between p-4 rounded-lg border bg-card">
  <span className="text-sm font-medium">Title</span>
  <button className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
    Action
  </button>
</div>
```

### cn() Helper Utility

Use the cn() helper to merge class names conditionally:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  variant === 'primary' && 'primary-class',
  size === 'large' && 'large-class',
  className
)}>
```

### Responsive Design

Implement responsive behavior with Tailwind breakpoints:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="col-span-1 lg:col-span-2">Wide content</div>
  <div>Sidebar</div>
</div>
```

## Component Organization

### File Structure

Organize components logically:

```
src/components/
├── ui/                    # Base UI components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── forms/                 # Form-specific components
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
└── dashboard/             # Feature-specific components
    ├── StatCard.tsx
    └── ChartWidget.tsx
```

### Export Pattern

Use index files for clean imports:

```typescript
// components/ui/index.ts
export { Button } from './button';
export { Card, CardHeader, CardTitle, CardContent } from './card';
export { Input } from './input';

// Usage
import { Button, Card, Input } from '@/components/ui';
```

## Additional Resources

### Reference Files

For detailed patterns and advanced techniques, consult:
- **`references/advanced-patterns.md`** - Advanced component patterns, compound components, render props
- **`references/radix-ui-integration.md`** - Complete Radix UI integration guide
- **`references/accessibility.md`** - Comprehensive accessibility implementation guide

### Example Files

Working examples available in `examples/`:
- **`examples/kpi-card.tsx`** - Complete KPI card implementation
- **`examples/form-components.tsx`** - Form component suite
- **`examples/dashboard-widget.tsx`** - Dashboard widget patterns

## Best Practices Summary

**DO:**
- Use TypeScript with explicit prop interfaces
- Apply React.memo for performance-critical components
- Implement accessibility from the start
- Leverage Radix UI for complex interactions
- Use CVA for maintainable variant systems
- Keep components focused and composable

**DON'T:**
- Create monolithic components
- Skip TypeScript type definitions
- Ignore accessibility requirements
- Inline complex logic in JSX
- Overuse React.memo on simple components
- Mix concerns (data fetching in UI components)

Build components that are type-safe, accessible, performant, and maintainable. Focus on composition and reusability for scalable component libraries.
