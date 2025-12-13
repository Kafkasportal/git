# UI Component Inventory

## 📋 Overview

Dernek Yönetim Sistemi uses a comprehensive, enterprise-grade component library built on:
- **React 19** - Modern React with server components
- **Radix UI** - Accessible primitive components
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Production-grade animations
- **TypeScript** - Full type safety

---

## 🎨 Foundation

### Colors
- **Primary**: Indigo (electric blue, corporate)
- **Secondary**: Slate (neutral, balanced)
- **Success**: Emerald (positive actions)
- **Warning**: Amber (caution states)
- **Error**: Rose/Red (destructive actions)
- **Info**: Cyan (informational)

### Typography
- **Font Family**: Inter (system font stack)
- **Heading Font**: Same (optimized for hierarchy)
- **Monospace**: Fira Code (code blocks)
- **Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Weights**: 400, 500, 600, 700

### Spacing
- **Scale**: xs (0.25rem), sm (0.5rem), md (1rem), lg (1.5rem), xl (2rem), 2xl (3rem)
- **Base Unit**: 4px (quarter rem increments)
- **Grid**: 8px base for layouts

### Shadows
- **xs**: Subtle (0 1px 2px)
- **sm**: Light (0 1px 2px / 0 1px 2px -1px)
- **md**: Medium (0 4px 6px -1px)
- **lg**: Elevated (0 10px 15px -3px)
- **glass**: Glassmorphism effect

### Border Radius
- **xs**: 0.25rem (2px)
- **sm**: 0.375rem (3px)
- **md**: 0.5rem (4px)
- **lg**: 0.75rem (6px)
- **xl**: 1rem (8px)
- **2xl**: 1.25rem (10px)
- **Default**: 0.75rem (12px) - modern feel

---

## 🧩 Component Library

### Layout Components

#### PageLayout
- Full-page layout with header, sidebar, content
- Supports breadcrumbs, badges, actions
- Responsive design

#### Card
- **Variants**: default, interactive, elevated, outline, ghost
- **Sizes**: sm, default, lg
- **Features**: animated prop, responsive padding
- **Subcomponents**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction

#### Tabs
- **From**: Radix UI Tabs
- **Features**: Keyboard navigation, animations
- **Styling**: Custom tab triggers and content

### Navigation Components

#### ModernSidebar
- Collapsible sidebar (localStorage state)
- Permission-based menu filtering
- Smooth animations with Framer Motion
- Hover tooltips on collapsed state
- Module grouping with sub-pages

#### MobileBottomNav
- Fixed bottom navigation (mobile)
- Auto-hide on scroll down
- Badge support for notifications
- Menu modal for additional items
- Safe area support

#### Breadcrumb
- Responsive breadcrumb navigation
- Active page indicator
- Customizable separator

### Input Components

#### Input
- **Variants**: default, error, success
- **Placeholder**: Accessible
- **State**: aria-invalid support
- **Features**: File upload, auto-complete

#### Label
- **Accessible**: htmlFor linking
- **Error styling**: Automatic red color on aria-invalid
- **Required indicator**: Optional asterisk

#### Textarea
- **Resize**: Vertical, auto-expand
- **States**: Focus, disabled, error
- **Features**: Character count, validation feedback

#### Select
- **From**: Radix UI
- **Features**: Search, multi-select, groups
- **Keyboard**: Full keyboard navigation

#### Checkbox
- **From**: Radix UI
- **Features**: Indeterminate state
- **Styling**: Custom colors per variant
- **Accessibility**: ARIA labels

#### Switch
- **From**: Radix UI
- **Features**: Disabled state, animation
- **Accessibility**: aria-checked

#### RadioGroup
- **From**: Radix UI
- **Features**: Item grouping
- **Keyboard**: Arrow key navigation

#### DatePicker
- **Calendar**: React Day Picker
- **Range**: Date range selection
- **Presets**: Common date ranges
- **Features**: Disabled dates, custom formatting

### Display Components

#### Badge
- **Variants**: default, secondary, outline, destructive
- **Sizes**: default, sm, lg
- **Features**: Icons, animations

#### Alert
- **Variants**: default, destructive
- **Content**: Title, description, action button
- **Styling**: Color-coded backgrounds

#### AlertDialog
- **From**: Radix UI
- **Purpose**: Destructive actions confirmation
- **Features**: Cancel/Confirm actions

#### Skeleton
- **Variants**: Shimmer animation
- **Deterministic widths**: Consistent renders
- **Types**: Generic skeleton, specialized (TableSkeleton, CardSkeleton, etc.)

#### EmptyState
- **Variants**: default, minimal, illustration
- **Icons**: 8+ pre-built SVG illustrations
- **Features**: Custom action buttons
- **Animations**: Fade-in with Framer Motion

#### Progress
- **From**: Radix UI
- **Features**: Animated indeterminate state
- **Styling**: Gradient fill, background color

### Feedback Components

#### Toast/Notification
- **Library**: Sonner (sonner npm)
- **Enhanced Wrapper**: enhancedToast utility
- **Types**: success, error, warning, info, loading
- **Features**: Icons, action buttons, auto-dismiss
- **Position**: Top-right (customizable)
- **Limit**: 3 visible toasts max

#### Dialog/Modal
- **From**: Radix UI
- **Features**: Backdrop blur, animations
- **Keyboard**: Escape to close, focus trap
- **Accessibility**: Proper ARIA roles

#### Tooltip
- **From**: Radix UI
- **Features**: Hover trigger, keyboard accessible
- **Position**: Auto-adjust to viewport
- **Animation**: Fade-in with scale

### Data Display Components

#### DataTable
- **Features**: Search, pagination, sorting
- **Columns**: Custom render functions
- **Loading**: Skeleton state
- **Empty**: Custom empty message
- **Styling**: Striped rows, hover effects

#### ResponsiveTable
- **Layouts**: Desktop table, tablet cards, mobile stacked
- **Column hiding**: Per breakpoint
- **Actions**: Row-level actions
- **Mobile-first**: Progressive enhancement

#### VirtualizedDataTable
- **Performance**: Virtualization for 1000+ rows
- **Features**: Same as DataTable
- **Optimization**: useVirtual hook

#### Table
- **From**: Radix UI primitives
- **Semantic HTML**: thead, tbody, tr, td
- **Styling**: Custom borders, hover states

### Metric/Stats Components

#### KPICard
- **Theme colors**: 7 themes (green, orange, blue, red, gray, purple, pink)
- **Features**: Icon, value, description, trend
- **Animations**: Hover lift effect
- **Responsive**: Text truncation, mobile-friendly

#### MetricCard
- **Variants**: 8 styles (default, gradient, outlined, glass, success, warning, error, info)
- **Sizes**: sm, md, lg
- **Features**: Animated counter, trend indicator, sub-metrics
- **Icon**: Dynamic icon component
- **Responsive**: Size-based padding and font

#### ComparisonMetricCard
- **Purpose**: Compare with previous period
- **Features**: Auto-calculated trend (up/down/neutral)
- **Percentage change**: Automatic calculation

#### MetricCardsGrid
- **Responsive columns**: 1-5 column grid
- **Gap control**: sm, md, lg spacing
- **Mobile-first**: Adapts to screen size

### Form Components

#### Form System
- **Library**: React Hook Form
- **Validation**: Zod schemas
- **Resolver**: zodResolver integration
- **Field**: FormField, FormItem, FormLabel, FormDescription, FormMessage
- **State**: Error states, disabled, touched

#### FormFieldGroup
- **Purpose**: Group related form fields
- **Features**: Label, description, error, helper text
- **Layout**: Vertical stacking with proper spacing

#### AdvancedBeneficiaryForm
- **Type**: Tab-based multi-step form
- **Validation**: Comprehensive Zod schema
- **Mutation**: React Query integration
- **Features**: Auto-save, field sanitization, error handling

#### BeneficiaryQuickAddModal
- **Type**: Quick-add dialog
- **Purpose**: Fast beneficiary registration
- **Features**: Essential fields only

#### BeneficiaryFormWizard
- **Type**: Step-by-step wizard
- **Steps**: Personal → Address → Family → Financial → Health
- **Features**: Progress indicator, step navigation

#### DonationForm
- **Fields**: Amount, donor, date, notes
- **Validation**: Currency validation
- **Features**: Preset amounts, donor lookup

#### MessageForm
- **Type**: Rich message editor
- **Features**: Text formatting, recipients selection
- **Attachments**: File upload support

#### MeetingForm
- **Fields**: Title, date, attendees, agenda
- **Features**: Reminder settings, agenda items

### Animation Components

#### FadeIn
- **Props**: delay, duration, direction (up/down/left/right/none)
- **Trigger**: whileInView with scroll trigger
- **Easing**: Custom cubic-bezier

#### StaggerChildren / StaggerItem
- **Purpose**: Sequential animations for lists
- **Features**: Configurable stagger delay
- **Performance**: GPU accelerated

#### PageTransition
- **Purpose**: Smooth page transitions
- **Features**: Enter/exit animations
- **Duration**: 250-400ms typically

### Utility Components

#### Button
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon, icon-sm, icon-lg
- **Features**: Icon support, loading state, disabled
- **Accessibility**: Focus ring, aria-pressed

#### Separator
- **From**: Radix UI
- **Orientation**: Horizontal, vertical
- **Decorative**: Optional aria-hidden

#### Popover
- **From**: Radix UI
- **Features**: Click/focus trigger
- **Position**: Auto-adjust to viewport

#### Dropdown Menu
- **From**: Radix UI
- **Features**: Sub-menus, icons, keyboard shortcut hints
- **Styling**: Custom separators, checkmarks

#### ScrollArea
- **From**: Radix UI
- **Features**: Custom scrollbar styling
- **Behavior**: Smooth scroll with momentum

#### ErrorBoundary
- **Purpose**: Catch React errors gracefully
- **Features**: Custom fallback UI
- **Error logging**: Integration ready

### Advanced Components

#### NotificationCenter
- **Features**: Group notifications by type
- **Actions**: Mark as read, delete
- **Real-time**: SSE integration ready

#### DashboardWidgets
- **Types**: Stats, charts, activity, quick-actions, currency, table, notifications
- **Layout**: Drag-and-drop grid (react-grid-layout)
- **Persistence**: localStorage save/load

#### WidgetGrid
- **Purpose**: Manage widget layout
- **Features**: Edit mode, add/remove widgets, reset layout
- **Responsive**: Auto-adjust columns per breakpoint

#### KanbanBoard
- **Features**: Drag-and-drop tasks
- **Columns**: Customizable swim lanes
- **Cards**: Task details, assignees, due dates

### Loading States

#### TableSkeleton
- **Rows**: Customizable count
- **Columns**: Customizable count
- **Animation**: Staggered pulse effect

#### CardSkeleton
- **Options**: Image, avatar
- **Lines**: Configurable text lines
- **Width**: Deterministic width patterns

#### ChartSkeleton
- **Types**: bar, line, pie, area
- **Bars**: 7 bars with variable heights

#### StatsSkeleton
- **Count**: 4 cards by default
- **Layout**: 2-column responsive

#### ListSkeleton
- **Items**: Configurable count
- **Options**: Avatar, action buttons

#### FormSkeleton
- **Fields**: Customizable field count
- **Buttons**: Submit and cancel skeleton

#### ProfileSkeleton
- **Layout**: Avatar + info + grid of fields

#### PageSkeleton
- **Layout**: Full page with header, stats, table

---

## 🎬 Animations & Motion

### Animation Library
- **Primary**: Framer Motion
- **CSS**: Custom keyframe animations
- **Duration**: 150-600ms (configurable)
- **Easing**: cubic-bezier, spring, etc.

### Pre-built Animations
- **page-enter**: Fade + slide up (250ms)
- **page-exit**: Fade + slide down (150ms)
- **fade-in**: Opacity 0→1 (300ms)
- **slide-up**: Translate + fade (300ms)
- **slide-down**: Translate + fade (300ms)
- **modal-enter**: Scale + fade (200ms)
- **toast-enter**: Slide right + fade (250ms)
- **spin-smooth**: Smooth rotation (1s infinite)
- **pulse-smooth**: Scale + opacity pulse (2s infinite)

### Performance
- **GPU Acceleration**: translateZ(0), will-change
- **Contain**: CSS containment for layout performance
- **Reduced Motion**: Respects prefers-reduced-motion media query

---

## 🌙 Dark Mode

### Implementation
- **Strategy**: CSS variables + class-based (`.dark` class)
- **Persistence**: localStorage + system preference
- **Transition**: Smooth 300ms transition between themes

### Color Overrides
- **Background**: Dark slate-950 to slate-900
- **Foreground**: Light slate-50
- **Cards**: Glassy dark with subtle gradients
- **Primary**: Lighter indigo-400 for contrast
- **Borders**: Subtle slate-800 borders

### Features
- **Auto Detection**: System preference by default
- **Toggle**: Manual theme switcher
- **Persistence**: Remembered across sessions

---

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px (default)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile Optimizations
- **Touch Targets**: 44x44px minimum
- **Font Size**: 16px base (prevents zoom on iOS)
- **Safe Areas**: Support for notched devices (env(safe-area-inset-*))
- **Tap Feedback**: -webkit-tap-highlight-color: transparent

### Responsive Tables
- **Desktop**: Traditional table layout
- **Tablet**: Card grid (2 columns)
- **Mobile**: Single-column stacked cards

---

## ♿ Accessibility

### ARIA
- **Roles**: button, dialog, alert, region, etc.
- **Labels**: aria-label, aria-labelledby
- **Descriptions**: aria-describedby
- **States**: aria-pressed, aria-invalid, aria-expanded, aria-checked
- **Live**: aria-live="polite" for notifications

### Keyboard Navigation
- **Tab Order**: Logical flow through all interactive elements
- **Focus Visible**: 2px outline with 2px offset
- **Escape**: Close modals and popovers
- **Enter/Space**: Activate buttons and toggles
- **Arrow Keys**: Navigate lists, menus, tabs

### Screen Readers
- **Skip Link**: Skip to main content
- **Semantic HTML**: h1-h6, button, label, ul/ol/li
- **Form Labels**: Associated with inputs
- **Hidden Content**: .sr-only class for screen reader text
- **Images**: alt text on all meaningful images

### Color Contrast
- **WCAG AA**: Minimum 4.5:1 for text
- **WCAG AAA**: 7:1 for large text
- **Verified**: All text colors meet standards

### Reduced Motion
- **Respected**: prefers-reduced-motion media query
- **Fallback**: No animations, direct state changes
- **Duration**: 0.01ms when motion reduced

---

## 🚀 Performance

### Code Splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Route-based**: Automatic route-based code splitting

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Package Imports**: Optimized package imports list
- **Package Config**: optimizePackageImports in next.config

### CSS
- **Utility-first**: Tailwind CSS for minimal CSS
- **Purging**: Unused styles removed automatically
- **Critical CSS**: Automatically extracted

### Images
- **Lazy Loading**: Native lazy loading
- **Optimization**: AVIF, WebP, JPEG formats
- **Responsive**: srcset for different devices
- **Next.js Image**: Automatic optimization

### Caching
- **Static Assets**: 1 year cache (immutable)
- **API Responses**: No cache (dynamic)
- **Browser Cache**: Appropriate cache headers

---

## 📐 Design System Variables

### CSS Custom Properties
- `--color-primary`: Main brand color
- `--color-background`: Page background
- `--color-card`: Card background
- `--color-border`: Border color
- `--color-text-*`: Text colors
- `--shadow-*`: Shadow presets
- `--radius`: Border radius default
- `--sidebar-*`: Sidebar colors
- `--chart-*`: Chart colors (5 variants)

### Tailwind Config Extensions
- **colors**: Extended palette
- **fontFamily**: Custom font stack
- **fontSize**: Consistent sizes
- **spacing**: Design tokens
- **boxShadow**: Custom shadows
- **animation**: 6 pre-built animations
- **keyframes**: Animation definitions

---

## 🔧 Component Usage Examples

### Button
```tsx
<Button variant="default" size="md" onClick={handleClick}>
  Click me
</Button>
```

### Card
```tsx
<Card className="w-full">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### MetricCard
```tsx
<MetricCard
  title="Total Donations"
  value={150000}
  prefix="₺"
  variant="gradient"
  animated
  trend={{ value: 12.5, direction: 'up', label: 'This month' }}
  icon={DollarSign}
/>
```

### Form
```tsx
<Form {...methods}>
  <FormField
    control={methods.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <Input {...field} type="email" />
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

---

## 📚 Resources

- **Radix UI**: https://radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Framer Motion**: https://www.framer.com/motion/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Production Ready
