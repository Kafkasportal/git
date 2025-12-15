# Quick Color & Styling Reference

## 🎨 Color Quick Reference

### Primary Blue (Main Brand)
```
corporate-primary-50:  #F0F5FF (Very Light - Backgrounds)
corporate-primary-100: #E8F0FF (Light - Card backgrounds)
corporate-primary-200: #D6E4FF (Light border)
corporate-primary-300: #BBCFFF 
corporate-primary-400: #99B2FF
corporate-primary-500: #7A8AFF
corporate-primary-600: #0052CC ⭐ (Primary - Buttons, links)
corporate-primary-700: #003A99 (Dark - Hover states)
corporate-primary-800: #002966 (Darker)
corporate-primary-900: #001A4D (Darkest)
```

### Gray (Neutral)
```
corporate-gray-50:  #FAFBFC (Very light background)
corporate-gray-100: #F5F7FA (Light background)
corporate-gray-200: #E8EBF0 (Borders, dividers)
corporate-gray-300: #DDD (Light border)
corporate-gray-400: #C5CED6
corporate-gray-500: #A0ABB8 (Muted text)
corporate-gray-600: #718096 (Secondary text)
corporate-gray-700: #4A5568 (Darker text)
corporate-gray-800: #2D3748 (Dark backgrounds)
corporate-gray-900: #1A202C ⭐ (Main text color)
```

### Teal Accent (Modern)
```
corporate-accent-50:  #F0FFFE
corporate-accent-100: #E0FFFD
corporate-accent-200: #B3FFFB
corporate-accent-300: #80FFF9
corporate-accent-400: #4DFFF6
corporate-accent-500: #1AE5DB
corporate-accent-600: #17A2B8 ⭐ (Accent color)
corporate-accent-700: #127A89
corporate-accent-800: #0D525A
corporate-accent-900: #062A2E
```

### Semantic Colors
```
Success: #28A745 (Green) - Positive actions
Warning: #FFC107 (Amber) - Caution
Error:   #DC3545 (Red)   - Dangers, errors
Info:    #17A2B8 (Cyan)  - Information
```

## 🔘 Button Styles

### Primary Button
```tsx
className="bg-corporate-primary-600 hover:bg-corporate-primary-700 
           text-white font-semibold px-6 h-11 rounded-lg
           shadow-lg hover:shadow-xl transition-all"
```
**Use for**: Main actions, form submission, important CTAs

### Secondary Button
```tsx
className="bg-white border-2 border-corporate-gray-300 
           text-corporate-gray-900 hover:bg-corporate-gray-50
           font-semibold px-6 h-11 rounded-lg transition-all"
```
**Use for**: Alternative actions, cancel, back

### Success Button
```tsx
className="bg-corporate-success-600 hover:bg-corporate-success-700 
           text-white font-semibold"
```
**Use for**: Approve, confirm, save operations

### Danger Button
```tsx
className="bg-corporate-error-600 hover:bg-corporate-error-700 
           text-white font-semibold"
```
**Use for**: Delete, remove, destructive actions

### Ghost Button
```tsx
className="text-corporate-primary-600 hover:text-corporate-primary-700 
           hover:bg-corporate-primary-50"
```
**Use for**: Subtle actions, links-as-buttons

## 📦 Card Styles

### Standard Card
```tsx
className="bg-white border border-corporate-gray-200 rounded-lg 
           shadow-card hover:shadow-card-hover p-6 transition-shadow"
```

### Card with Header
```tsx
<div className="bg-white rounded-lg border border-corporate-gray-200 shadow-card">
  <div className="px-6 py-4 border-b border-corporate-gray-200 bg-corporate-gray-50">
    <h3 className="text-lg font-bold text-corporate-gray-900">Title</h3>
  </div>
  <div className="p-6">Content</div>
</div>
```

### Highlighted Card
```tsx
className="bg-corporate-primary-50 border-2 border-corporate-primary-200 
           rounded-lg p-6"
```

## 📝 Input Styles

### Base Input
```tsx
className="h-12 px-4 rounded-lg bg-white text-corporate-gray-900
           border border-corporate-gray-300 placeholder:text-corporate-gray-400
           focus:border-corporate-primary-500 focus:ring-4 
           focus:ring-corporate-primary-100 transition-all"
```

### Error Input
```tsx
className="border-corporate-error-500 
           focus:border-corporate-error-500 focus:ring-corporate-error-100"
```

### Disabled Input
```tsx
className="bg-corporate-gray-100 text-corporate-gray-400 
           border-corporate-gray-300 cursor-not-allowed"
```

## 📊 Table Styles

### Table Header
```tsx
className="bg-corporate-gray-50 border-b border-corporate-gray-300"
```

### Table Row
```tsx
className="border-b border-corporate-gray-200 hover:bg-corporate-gray-50 
           even:bg-corporate-gray-50/50 transition-colors"
```

### Table Cell
```tsx
className="px-6 py-4 text-sm text-corporate-gray-900"
```

## 🏷️ Badge/Label Styles

### Default Badge
```tsx
className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold
           bg-corporate-gray-100 text-corporate-gray-800"
```

### Primary Badge
```tsx
className="bg-corporate-primary-100 text-corporate-primary-700"
```

### Success Badge
```tsx
className="bg-corporate-success-100 text-corporate-success-700"
```

### Warning Badge
```tsx
className="bg-corporate-warning-100 text-corporate-warning-700"
```

### Error Badge
```tsx
className="bg-corporate-error-100 text-corporate-error-700"
```

## ⚠️ Alert Styles

### Info Alert
```tsx
className="bg-corporate-info-50 border border-corporate-info-200 rounded-lg p-4"
```

### Success Alert
```tsx
className="bg-corporate-success-50 border border-corporate-success-200 rounded-lg p-4"
```

### Warning Alert
```tsx
className="bg-corporate-warning-50 border border-corporate-warning-200 rounded-lg p-4"
```

### Error Alert
```tsx
className="bg-corporate-error-50 border border-corporate-error-200 rounded-lg p-4"
```

## 🔤 Typography

### Headings
```tsx
<h1 className="text-4xl font-bold text-corporate-gray-900">Large Heading</h1>
<h2 className="text-3xl font-bold text-corporate-gray-900">Heading 2</h2>
<h3 className="text-2xl font-semibold text-corporate-gray-900">Heading 3</h3>
<h4 className="text-xl font-semibold text-corporate-gray-900">Heading 4</h4>
```

### Body Text
```tsx
<p className="text-base text-corporate-gray-900">Normal paragraph</p>
<p className="text-sm text-corporate-gray-600">Secondary text</p>
<p className="text-xs text-corporate-gray-500">Muted text</p>
```

## 📏 Spacing Quick Reference

```
xs: 4px    - Tiny gaps, icon spacing
sm: 8px    - Small gaps, minor spacing
md: 16px   - Standard spacing (default)
lg: 24px   - Section spacing
xl: 32px   - Large sections
2xl: 48px  - Major spacing
3xl: 64px  - Page sections
4xl: 96px  - Full page spacing
```

## 🎯 Common Patterns

### Form Group
```tsx
<div className="space-y-2">
  <label className="text-sm font-semibold text-corporate-gray-900">
    Label Text
  </label>
  <input className="..." />
  <p className="text-xs text-corporate-gray-500">Helper text</p>
</div>
```

### Card with Action
```tsx
<div className="bg-white border border-corporate-gray-200 rounded-lg p-6 
                shadow-card hover:shadow-card-hover transition-shadow">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="text-lg font-semibold text-corporate-gray-900">Title</h3>
    </div>
    <button className="text-corporate-primary-600">Action</button>
  </div>
</div>
```

### Navigation Item
```tsx
<a className="px-4 py-2 rounded-lg text-corporate-gray-900 
             hover:bg-corporate-primary-50 hover:text-corporate-primary-600
             transition-colors">
  Nav Item
</a>
```

### Status Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold
                 bg-corporate-success-100 text-corporate-success-700">
  ✓ Active
</span>
```

## 🎨 CSS Variable Usage

```tsx
// Text color
className="text-[var(--foreground)]"

// Background
className="bg-[var(--background)]"

// Border
className="border-[var(--border)]"

// Shadow
className="shadow-[var(--shadow-md)]"

// Radius
className="rounded-[var(--radius-lg)]"

// Transition
className="transition-all duration-[var(--transition-normal)]"
```

## 📱 Responsive Utilities

```tsx
// Mobile first
className="text-sm md:text-base lg:text-lg"

// Grid
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Hidden/Visible
className="hidden lg:block"  // Hidden on mobile, visible on desktop
className="block lg:hidden"  // Visible on mobile, hidden on desktop

// Padding
className="p-4 md:p-6 lg:p-8"

// Width
className="w-full md:w-1/2 lg:w-1/3"
```

## ✨ Quick Checks

- [ ] Using colors from corporate palette (not random colors)
- [ ] Proper contrast ratio (4.5:1 for text)
- [ ] Consistent spacing (using scale)
- [ ] Focus states visible
- [ ] Keyboard navigable
- [ ] Mobile responsive
- [ ] Touch targets 44x44px minimum
- [ ] Icons properly sized (w-5 h-5 default)
- [ ] Shadows used for depth
- [ ] Transitions for interactivity

---

**Print this and keep at desk for quick reference!** 🚀
