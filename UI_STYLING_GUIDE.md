# UI/UX Styling Guide - Implementation

## 🎨 Color Usage by Component

### Buttons
```tsx
// Primary Button - Main Actions
<Button className="bg-gradient-to-r from-corporate-primary-600 to-corporate-primary-700 
                    hover:from-corporate-primary-700 hover:to-corporate-primary-800
                    text-white font-semibold shadow-lg">
  Giriş Yap
</Button>

// Secondary Button - Alternative Actions
<Button variant="outline" className="border-corporate-gray-300 text-corporate-gray-900
                                     hover:bg-corporate-gray-50">
  İptal Et
</Button>

// Success Button
<Button className="bg-corporate-success-600 hover:bg-corporate-success-700 text-white">
  Kaydet
</Button>

// Danger Button
<Button className="bg-corporate-error-600 hover:bg-corporate-error-700 text-white">
  Sil
</Button>
```

### Cards & Containers
```tsx
// Standard Card
<div className="bg-white rounded-lg border border-corporate-gray-200 shadow-card 
                hover:shadow-card-hover p-6 transition-shadow duration-200">
  Card Content
</div>

// Card with Header
<div className="bg-white rounded-lg border border-corporate-gray-200 shadow-card overflow-hidden">
  <div className="px-6 py-4 border-b border-corporate-gray-200 bg-corporate-gray-50">
    <h3 className="text-lg font-semibold text-corporate-gray-900">Başlık</h3>
  </div>
  <div className="p-6">Card Content</div>
</div>

// Highlighted Card
<div className="bg-corporate-primary-50 border border-corporate-primary-200 
                rounded-lg p-6 shadow-sm">
  Important Content
</div>
```

### Inputs & Forms
```tsx
// Input Field
<Input 
  className="h-12 px-4 bg-white border-corporate-gray-300 text-corporate-gray-900
             placeholder:text-corporate-gray-400 
             focus:border-corporate-primary-500 focus:ring-4 focus:ring-corporate-primary-100
             rounded-lg transition-all duration-200"
  placeholder="Metin girin..."
/>

// Input with Icon
<div className="relative group">
  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-corporate-gray-500 
                    group-focus-within:text-corporate-primary-600" />
  <Input className="pl-11 ..." />
</div>

// Error Input
<Input className="border-corporate-error-500 focus:border-corporate-error-500 
                   focus:ring-corporate-error-100" />

// Disabled Input
<Input disabled className="bg-corporate-gray-100 text-corporate-gray-400 cursor-not-allowed" />
```

### Tables
```tsx
// Table Header
<thead className="bg-corporate-gray-50 border-b border-corporate-gray-300">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-semibold text-corporate-gray-900 
                    uppercase tracking-wider">
      Sütun Başlığı
    </th>
  </tr>
</thead>

// Table Row - Hover
<tbody>
  <tr className="border-b border-corporate-gray-200 hover:bg-corporate-gray-50 
                  transition-colors duration-150">
    <td className="px-6 py-4 text-sm text-corporate-gray-900">Veri</td>
  </tr>
</tbody>

// Table with Striped Rows
<tr className="border-b border-corporate-gray-200 hover:bg-corporate-gray-50 
               even:bg-corporate-gray-50/50 transition-colors">
</tr>
```

### Navigation
```tsx
// Active Nav Item
<a className="text-corporate-primary-600 bg-corporate-primary-50 border-l-4 
              border-corporate-primary-600 pl-4">
  Aktif Sayfa
</a>

// Inactive Nav Item
<a className="text-corporate-gray-600 hover:text-corporate-gray-900 
              hover:bg-corporate-gray-50 pl-4 transition-colors">
  Sayfa
</a>

// Breadcrumb
<nav className="text-sm text-corporate-gray-600">
  <a className="text-corporate-primary-600 hover:underline">Ana Sayfa</a>
  <span className="mx-2 text-corporate-gray-400">/</span>
  <span className="text-corporate-gray-900">Mevcut Sayfa</span>
</nav>
```

### Badges & Labels
```tsx
// Badge - Default
<span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold
                 bg-corporate-gray-100 text-corporate-gray-800">
  Label
</span>

// Badge - Primary
<span className="bg-corporate-primary-100 text-corporate-primary-700">Primary</span>

// Badge - Success
<span className="bg-corporate-success-100 text-corporate-success-700">Başarılı</span>

// Badge - Warning
<span className="bg-corporate-warning-100 text-corporate-warning-700">Uyarı</span>

// Badge - Error
<span className="bg-corporate-error-100 text-corporate-error-700">Hata</span>
```

### Alerts & Messages
```tsx
// Alert - Info
<div className="bg-corporate-info-50 border border-corporate-info-200 rounded-lg p-4">
  <p className="text-sm text-corporate-info-900 font-medium">Bilgilendirme Mesajı</p>
</div>

// Alert - Success
<div className="bg-corporate-success-50 border border-corporate-success-200 rounded-lg p-4">
  <p className="text-sm text-corporate-success-900">Işlem başarılı</p>
</div>

// Alert - Warning
<div className="bg-corporate-warning-50 border border-corporate-warning-200 rounded-lg p-4">
  <p className="text-sm text-corporate-warning-900">Dikkat!</p>
</div>

// Alert - Error
<div className="bg-corporate-error-50 border border-corporate-error-200 rounded-lg p-4">
  <p className="text-sm text-corporate-error-900">Bir hata oluştu</p>
</div>
```

## 📐 Spacing Patterns

### Container & Padding
```tsx
// Page Container
<main className="max-w-container mx-auto px-4 md:px-6 lg:px-8 py-8">

// Card Padding
<div className="p-6">  // md spacing (1.5rem)

// Tight Layout
<div className="p-4">  // sm spacing (1rem)

// Relaxed Layout
<div className="p-8">  // lg spacing (2rem)

// Content Section
<section className="space-y-6">  // Gap between sections
```

### Margin Patterns
```tsx
// Section Spacing
<div className="mb-8">  // Margin below section

// Item Spacing
<div className="space-y-4">  // Vertical spacing between items
<div className="gap-4">  // Horizontal spacing in grid/flex

// Top Margin Reset
<div className="mt-0">  // Reset default margins
```

## 🎭 Responsive Design

### Breakpoints
```tsx
// Mobile First
<div className="text-sm md:text-base lg:text-lg">
  Text sizes adjust per breakpoint
</div>

// Grid Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Grid adapts to screen size
</div>

// Sidebar Layout
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-[var(--sidebar-width)]">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>

// Hidden on Mobile
<div className="hidden lg:block">Large screens only</div>
<div className="block lg:hidden">Mobile only</div>
```

## 🎬 Animations & Transitions

### Hover Effects
```tsx
// Subtle Hover
className="hover:shadow-card-hover transition-shadow duration-200"

// Color Transition
className="text-corporate-gray-900 hover:text-corporate-primary-600 
           transition-colors duration-200"

// Scale Effect (Cards)
className="hover:scale-105 transition-transform duration-200"

// Background Fade
className="hover:bg-corporate-gray-50 transition-colors duration-200"
```

### Focus States
```tsx
// Input Focus
className="focus:border-corporate-primary-500 focus:ring-4 
           focus:ring-corporate-primary-100 transition-all"

// Button Focus
className="focus:ring-4 focus:ring-corporate-primary-100 
           focus:outline-none"

// Link Focus
className="focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary-500"
```

### Loading States
```tsx
// Spinner
<Loader2 className="w-4 h-4 animate-spin" />

// Pulsing
<div className="animate-pulse-smooth">Loading...</div>

// Skeleton
<div className="animate-pulse bg-corporate-gray-200 rounded" />
```

## ♿ Accessibility

### Color Contrast
- Text on background: 4.5:1 minimum
- UI components: 3:1 minimum
- Large text: 3:1 acceptable

### Focus Indicators
```tsx
// Always visible focus
className="focus:ring-2 focus:ring-offset-2 focus:ring-corporate-primary-500 
           focus:outline-none"

// High contrast mode
@media (prefers-contrast: more) {
  // Darker colors, thicker borders
}
```

### Keyboard Navigation
- Tab order logical
- No focus traps
- Escape closes modals
- Arrow keys for lists

### Screen Readers
```tsx
// Semantic HTML
<button aria-label="Menu açılır kapanır">
  <MenuIcon />
</button>

// Hidden from readers
<span aria-hidden="true">●</span>

// Form labels
<label htmlFor="email">Email</label>
<input id="email" />
```

## 🌍 Dark Mode (Future)

### Preparing for Dark Mode
```tsx
// Use CSS variables
className="bg-white dark:bg-corporate-dark-800"

// Semantic colors
className="text-corporate-gray-900 dark:text-corporate-gray-100"

// System preference
@media (prefers-color-scheme: dark) {
  // Dark styles
}
```

## 📱 Mobile Optimization

### Touch Targets
- Minimum 44x44px for interactive elements
- Proper padding around buttons

### Text Sizing
```tsx
// Mobile-first scaling
<p className="text-sm md:text-base lg:text-lg">
```

### Readable Width
```tsx
// Line length 45-75 characters optimal
<div className="max-w-prose">Content</div>
```

## 🚀 Performance Best Practices

### CSS Optimization
- Use Tailwind utility classes
- Avoid inline styles
- Leverage CSS variables
- Group related properties

### Image Optimization
```tsx
// Use Next.js Image
<Image 
  src="..." 
  alt="Description"
  width={400}
  height={300}
/>
```

### Animation Performance
```tsx
// Use transform instead of top/left
className="translate-x-4"

// Use GPU acceleration
className="translate-z-0"

// Prefer will-change sparingly
className="will-change-transform"
```

## 📊 Component Sizes

### Button Sizes
- **Small**: h-9 px-3 text-sm
- **Medium**: h-11 px-4 text-base
- **Large**: h-13 px-6 text-lg

### Card Sizes
- **Small**: max-w-xs (20rem)
- **Medium**: max-w-md (28rem)
- **Large**: max-w-2xl (42rem)
- **Full**: max-w-container (1400px)

### Icon Sizes
- **Tiny**: w-3 h-3
- **Small**: w-4 h-4 (default)
- **Medium**: w-5 h-5
- **Large**: w-6 h-6
- **XL**: w-8 h-8

## 🎯 Implementation Checklist

- [ ] Update Tailwind config with corporate colors
- [ ] Update CSS variables in theme-variables.css
- [ ] Create component variant examples
- [ ] Update all buttons to use new styles
- [ ] Update card styling across app
- [ ] Update table styling
- [ ] Update form inputs
- [ ] Update navigation styling
- [ ] Test on mobile devices
- [ ] Verify dark mode preparation
- [ ] Test accessibility with screen readers
- [ ] Verify keyboard navigation
- [ ] Test all focus states
- [ ] Check color contrast ratios
- [ ] Performance testing

## 📚 Reference Documents

- `CORPORATE_DESIGN_SYSTEM.md` - Complete design system
- `tailwind.config.js` - Tailwind configuration
- `src/styles/theme-variables.css` - CSS variables
- Component examples in `/src/components/ui/`

---

**Last Updated**: 2025-12-15
**Status**: Ready for Implementation
