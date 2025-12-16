# Corporate Design System - Dernek Yönetim Sistemi

## Color Palette - Kurumsal Renk Şeması

### Primary Colors (Ana Renkler)
- **Primary Blue**: `#0052CC` / `rgb(0, 82, 204)` - Profesyonellik, güven
- **Dark Blue**: `#003A99` / `rgb(0, 58, 153)` - Derinlik, ağırlık
- **Light Blue**: `#E8F0FF` / `rgb(232, 240, 255)` - Hafiflik, arka plan

### Secondary Colors (Tamamlayıcı Renkler)
- **Teal Accent**: `#17A2B8` / `rgb(23, 162, 184)` - Dinamizm, modern
- **Government Gray**: `#2B3E50` / `rgb(43, 62, 80)` - Profesyonellik, stabilite
- **Light Gray**: `#F5F7FA` / `rgb(245, 247, 250)` - Temizlik, açıklık

### Semantic Colors (Anlamsal Renkler)
- **Success**: `#28A745` / `rgb(40, 167, 69)` - Başarı, onay
- **Warning**: `#FFC107` / `rgb(255, 193, 7)` - Uyarı, dikkat
- **Error**: `#DC3545` / `rgb(220, 53, 69)` - Hata, tehlike
- **Info**: `#17A2B8` / `rgb(23, 162, 184)` - Bilgi, bildiriş

### Neutral Colors (Nötr Renkler)
- **Text Dark**: `#1A202C` / `rgb(26, 32, 44)` - Ana metin
- **Text Gray**: `#718096` / `rgb(113, 128, 150)` - İkincil metin
- **Text Light**: `#CBD5E0` / `rgb(203, 213, 224)` - Zayıf metin
- **Background**: `#FFFFFF` / `rgb(255, 255, 255)` - Açık arka plan
- **Border**: `#E2E8F0` / `rgb(226, 232, 240)` - Sınırlar

## Typography - Yazı Tipi Sistemi

### Font Families
- **Heading**: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
- **Body**: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
- **Mono**: `Fira Code, monospace`

### Font Sizes & Line Heights
```
Display: 3.75rem (60px) / 3.5
Large Heading (H1): 2.25rem (36px) / 2.5
Heading (H2): 1.875rem (30px) / 2.25
Subheading (H3): 1.5rem (24px) / 2
Title (H4): 1.25rem (20px) / 1.75
Subtitle: 1.125rem (18px) / 1.75
Base: 1rem (16px) / 1.5
Small: 0.875rem (14px) / 1.25
Extra Small: 0.75rem (12px) / 1
```

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing System - Boşluk Sistemi

```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

## Border Radius - Köşe Yuvarlamaları

```
xs: 0.25rem (4px)
sm: 0.375rem (6px)
md: 0.5rem (8px)
lg: 0.75rem (12px)
xl: 1rem (16px)
2xl: 1.25rem (20px)
```

## Components - Bileşen Stilleri

### Card Component
```
Background: White (#FFFFFF)
Border: 1px solid #E2E8F0
Border Radius: lg (0.75rem)
Box Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
Padding: 1.5rem
Hover Shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
```

### Button Component
**Primary Button**
```
Background: Linear Gradient from #0052CC to #003A99
Text Color: White
Padding: 0.75rem 1.5rem
Border Radius: lg (0.75rem)
Font Weight: 600
Box Shadow: 0 2px 8px rgba(0, 82, 204, 0.25)
Hover: Gradient from #003A99 to #002966
Active: Scale 0.95
```

**Secondary Button**
```
Background: #F5F7FA
Text Color: #0052CC
Border: 1px solid #E2E8F0
Padding: 0.75rem 1.5rem
Border Radius: lg
Font Weight: 600
Hover: Background #E8F0FF, Border #0052CC
```

**Ghost Button**
```
Background: Transparent
Text Color: #0052CC
Border: None
Padding: 0.75rem 1.5rem
Hover: Background #F5F7FA
```

### Input Component
```
Background: White (#FFFFFF)
Border: 1px solid #E2E8F0
Border Radius: lg (0.75rem)
Padding: 0.75rem 1rem
Font Size: 1rem
Line Height: 1.5
Placeholder Color: #718096
Focus: Border #0052CC, Ring 2px #0052CC
Error: Border #DC3545, Ring #DC3545/20
Disabled: Background #F5F7FA, Color #CBD5E0
```

### Table Component
```
Header Background: #F5F7FA
Header Text: #1A202C (Bold)
Row Hover: Background #F9FAFB
Border: 1px solid #E2E8F0
Row Padding: 1rem
Font Size: 0.875rem (14px)
Alternating Rows: Yes (subtle gray)
```

### Badge Component
```
Padding: 0.375rem 0.75rem
Border Radius: md (0.5rem)
Font Size: 0.75rem (12px)
Font Weight: 600
Default: Background #F5F7FA, Text #1A202C
Primary: Background #0052CC, Text White
Success: Background #E8F5E9, Text #2E7D32
Warning: Background #FFF3E0, Text #E65100
Error: Background #FFEBEE, Text #C62828
```

## Dashboard Widgets - Kontrol Paneli Bileşenleri

### KPI Card
```
Background: White/Gradient subtle
Border: 1px solid #E2E8F0
Border Radius: lg
Padding: 1.5rem
Icon Background: Soft color (10% opacity)
Value Font: 2.25rem, Bold
Change Text: 0.875rem, Gray
Hover: Subtle shadow increase
```

### Widget Container
```
Background: White
Border: 1px solid #E2E8F0
Border Radius: lg
Padding: 1.5rem
Header: 1.25rem font, Bold
Actions: Right-aligned, subtle
Content Spacing: md (1rem)
```

### Stats Bar
```
Segments: Blue (#0052CC) → Teal (#17A2B8)
Height: 8px
Border Radius: full
Background: #E2E8F0
```

## Forms - Form Stilleri

### Form Group
```
Margin Bottom: 1.5rem
Label: 0.875rem, Semibold, #1A202C
Help Text: 0.75rem, #718096
Error Text: 0.75rem, #DC3545
```

### Multi-step Form
```
Step Number: 1rem, Bold, #0052CC
Step Label: 0.875rem, #1A202C
Step Connector: 1px solid #E2E8F0
Active: #0052CC
Completed: ✓ #28A745
Current: #0052CC
```

## Navigation - Navigasyon

### Sidebar
```
Width: 256px (collapsed: 64px)
Background: White
Border Right: 1px solid #E2E8F0
Item Padding: 0.75rem 1rem
Item Height: 2.5rem
Active Item: Background #E8F0FF, Text #0052CC
Icon: 1.25rem, Centered
Font: 0.875rem
Hover: Background #F9FAFB
```

### Header/Top Navigation
```
Height: 64px
Background: White
Border Bottom: 1px solid #E2E8F0
Padding: 0 2rem
Logo: 2rem height
User Menu: Circular avatar, 2.5rem
Search: Width 300px, Soft gray
```

### Breadcrumb
```
Text: 0.875rem, #718096
Separator: / (gray)
Current: #1A202C, Bold
Hover: #0052CC
```

## States - Durumlar

### Hover State
```
Background Cards: +0.5% opacity white
Buttons: Darker shade or different background
Shadows: Increase by 1 level
Transitions: 150ms ease
```

### Focus State
```
Outline: 2px solid #0052CC
Outline Offset: 2px
No browser default outline
```

### Disabled State
```
Opacity: 50%
Cursor: not-allowed
Background: #F5F7FA (for inputs)
Text Color: #CBD5E0
```

### Loading State
```
Animation: pulse-smooth (2s)
Opacity: Pulse between 1 and 0.7
Skeleton: Gray #E2E8F0
```

## Shadows - Gölgeler

```
xs: 0 1px 2px rgba(0, 0, 0, 0.05)
sm: 0 1px 2px rgba(0, 0, 0, 0.05)
md: 0 4px 6px rgba(0, 0, 0, 0.1)
lg: 0 10px 15px rgba(0, 0, 0, 0.1)
xl: 0 20px 25px rgba(0, 0, 0, 0.1)
2xl: 0 25px 50px rgba(0, 0, 0, 0.25)
focus: 0 0 0 3px rgba(0, 82, 204, 0.1)
```

## Animations - Animasyonlar

### Transitions
```
Fast: 150ms
Normal: 200ms
Slow: 300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Keyframe Animations
```
fade-in: 0 → 1 (300ms)
slide-up: translateY(8px) → 0 (300ms)
slide-down: translateY(-8px) → 0 (300ms)
pulse-smooth: scale 1 → 0.98 (2s)
```

## Dark Mode (Gelecek)

### Future Dark Theme
```
Background: #1A202C
Surface: #2D3748
Text: #E2E8F0
Text Secondary: #A0AEC0
Border: #4A5568
Primary: #60AFFF (Lighter blue)
```

## Accessibility - Erişilebilirlik

### Contrast Ratios
- Text: 4.5:1 minimum (WCAG AA)
- UI Components: 3:1 minimum
- Large Text: 3:1 acceptable

### Focus Indicators
- Always visible
- 2px minimum width
- Distinct from hover state
- Color contrast 3:1

### Keyboard Navigation
- Tab order logical
- Focus traps prevented
- Escape to close modals
- Arrow keys for lists

## Implementation Notes

### Tailwind Configuration
All these values should be implemented in `tailwind.config.js` extend section:
- Colors as custom variables
- Typography scale
- Spacing scale
- Shadow definitions
- Animation keyframes

### CSS Variables
Use CSS custom properties in `src/styles/theme-variables.css`:
- Color variables
- Spacing variables
- Transition variables
- Z-index scale

### Component Structure
Each component should follow:
1. Base styles (size, padding, typography)
2. State styles (hover, focus, active, disabled)
3. Variant styles (primary, secondary, danger)
4. Responsive adjustments
5. Accessibility considerations

## Migration Path

1. **Phase 1**: Update color palette (variables)
2. **Phase 2**: Update buttons and basic components
3. **Phase 3**: Update forms and inputs
4. **Phase 4**: Update cards and containers
5. **Phase 5**: Update tables and data displays
6. **Phase 6**: Update navigation (sidebar, header)
7. **Phase 7**: Update dashboard widgets
8. **Phase 8**: Testing and refinement

---

**Status**: Design System v1.0
**Last Updated**: 2025-12-15
**Target**: Government/Enterprise Grade Professional UI
