# Advanced Component Patterns

Comprehensive guide to advanced React component patterns for building sophisticated, reusable UI components.

## Compound Components

Build flexible component APIs that allow consumers to compose interfaces declaratively.

### Pattern Overview

Compound components share implicit state and provide a declarative API:

```typescript
// Compound component example
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Implementation with Context

```typescript
import { createContext, useContext, useState } from 'react';

interface SelectContextValue {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select');
  }
  return context;
}

export function Select({ children, value, onValueChange }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onChange: onValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSelectContext();

  return (
    <button onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

export function SelectItem({ value, children }: SelectItemProps) {
  const { onChange, setOpen } = useSelectContext();

  return (
    <div
      onClick={() => {
        onChange(value);
        setOpen(false);
      }}
    >
      {children}
    </div>
  );
}
```

## Render Props Pattern

Provide flexibility by allowing consumers to control rendering logic.

### Basic Render Props

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{children(data, loading, error)}</>;
}

// Usage
<DataFetcher<User> url="/api/user">
  {(user, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    if (!user) return null;
    return <UserProfile user={user} />;
  }}
</DataFetcher>
```

### Function as Children

```typescript
interface ToggleProps {
  children: (props: { on: boolean; toggle: () => void }) => React.ReactNode;
  initialState?: boolean;
}

export function Toggle({ children, initialState = false }: ToggleProps) {
  const [on, setOn] = useState(initialState);
  const toggle = () => setOn(prev => !prev);

  return <>{children({ on, toggle })}</>;
}

// Usage
<Toggle>
  {({ on, toggle }) => (
    <div>
      <button onClick={toggle}>
        {on ? 'Hide' : 'Show'}
      </button>
      {on && <Content />}
    </div>
  )}
</Toggle>
```

## Controlled vs Uncontrolled Components

Implement components that support both controlled and uncontrolled modes.

### Dual-Mode Component

```typescript
interface InputProps {
  value?: string;  // Controlled
  defaultValue?: string;  // Uncontrolled
  onChange?: (value: string) => void;
}

export function Input({ value: controlledValue, defaultValue, onChange }: InputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (!isControlled) {
      setUncontrolledValue(newValue);
    }

    onChange?.(newValue);
  };

  return <input value={value} onChange={handleChange} />;
}

// Uncontrolled usage
<Input defaultValue="initial" />

// Controlled usage
const [value, setValue] = useState('');
<Input value={value} onChange={setValue} />
```

## Higher-Order Components (HOC)

Create reusable component logic through composition.

### WithLoading HOC

```typescript
interface WithLoadingProps {
  loading?: boolean;
}

export function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent(props: P & WithLoadingProps) {
    const { loading, ...restProps } = props;

    if (loading) {
      return <Spinner />;
    }

    return <Component {...(restProps as P)} />;
  };
}

// Usage
const UserListWithLoading = withLoading(UserList);
<UserListWithLoading users={users} loading={isLoading} />
```

### WithAuth HOC

```typescript
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;

    return <Component {...props} user={user} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

## Custom Hooks for Component Logic

Extract component logic into reusable hooks.

### useToggle Hook

```typescript
export function useToggle(initialState = false) {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => setState(prev => !prev), []);
  const setOn = useCallback(() => setState(true), []);
  const setOff = useCallback(() => setState(false), []);

  return { state, toggle, setOn, setOff };
}

// Usage in component
function Dropdown() {
  const { state: isOpen, toggle, setOff } = useToggle();

  return (
    <div>
      <button onClick={toggle}>Toggle</button>
      {isOpen && <Menu onClose={setOff} />}
    </div>
  );
}
```

### useDisclosure Hook

```typescript
interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}
```

## Polymorphic Components

Build components that can render as different HTML elements.

### As Prop Pattern

```typescript
import { ElementType, ComponentPropsWithoutRef } from 'react';

type PolymorphicProps<E extends ElementType> = {
  as?: E;
  children: React.ReactNode;
} & ComponentPropsWithoutRef<E>;

export function Text<E extends ElementType = 'p'>({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'p';
  return <Component {...props}>{children}</Component>;
}

// Usage
<Text>Default paragraph</Text>
<Text as="h1">Heading</Text>
<Text as="span" className="text-sm">Small text</Text>
```

### Button Polymorphic Component

```typescript
type ButtonOwnProps<E extends ElementType> = {
  as?: E;
  variant?: 'default' | 'primary';
};

type ButtonProps<E extends ElementType> = ButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

export function Button<E extends ElementType = 'button'>({
  as,
  variant = 'default',
  className,
  ...props
}: ButtonProps<E>) {
  const Component = as || 'button';

  return (
    <Component
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-primary text-white',
        className
      )}
      {...props}
    />
  );
}

// Usage
<Button>Regular button</Button>
<Button as="a" href="/home">Link button</Button>
```

## Slot-based Components

Use slots for flexible content placement.

### Named Slots Pattern

```typescript
interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ header, footer, children }: CardProps) {
  return (
    <div className="rounded-lg border p-4">
      {header && (
        <div className="border-b pb-2 mb-2">
          {header}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="border-t pt-2 mt-2">
          {footer}
        </div>
      )}
    </div>
  );
}

// Usage
<Card
  header={<h2>Card Title</h2>}
  footer={<button>Action</button>}
>
  Card content
</Card>
```

## State Reducer Pattern

Provide customizable state management for complex components.

### Implementation

```typescript
type State = {
  count: number;
};

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' };

function defaultReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      return state;
  }
}

interface CounterProps {
  reducer?: (state: State, action: Action) => State;
  children: (state: State, dispatch: React.Dispatch<Action>) => React.ReactNode;
}

export function Counter({ reducer = defaultReducer, children }: CounterProps) {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return <>{children(state, dispatch)}</>;
}

// Usage with custom reducer
function customReducer(state: State, action: Action): State {
  if (action.type === 'increment') {
    // Custom logic: increment by 2
    return { count: state.count + 2 };
  }
  return defaultReducer(state, action);
}

<Counter reducer={customReducer}>
  {(state, dispatch) => (
    <div>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </div>
  )}
</Counter>
```

## Performance Patterns

### Lazy Loading Components

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function LazyWrapper() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Virtualization for Large Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

**Compound Components:**
- Use for components with tightly coupled children
- Share state through Context API
- Provide clear error messages for misuse

**Render Props:**
- Use when consumers need control over rendering
- Keep render prop signatures simple
- Consider custom hooks as an alternative

**HOCs:**
- Name HOCs descriptively (withAuth, withLoading)
- Preserve component displayName
- Forward refs when needed
- Consider hooks as modern alternative

**Custom Hooks:**
- Extract reusable stateful logic
- Follow hooks rules (use prefix, call at top level)
- Return stable references with useCallback/useMemo

**Polymorphic Components:**
- Use for components that change semantic meaning
- Type carefully with TypeScript
- Document available element types

Apply these patterns judiciously based on component requirements. Prioritize simplicity and choose the pattern that best fits the use case.
