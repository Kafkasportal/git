# UI Studio Plugin

Comprehensive UI component, animation, and theme generator for Next.js + Tailwind v4 + Framer Motion projects.

## Overview

UI Studio accelerates frontend development by automating the creation of:
- React components with TypeScript and Tailwind CSS
- Framer Motion animations and transitions
- Color themes and design tokens
- Component variants and styles

## Features

### 🎨 Component Generation
- KPI/Stat Cards
- Form components (Input, Select, Checkbox)
- Dashboard widgets (Charts, Tables, Metrics)
- Layout components (Container, Grid, Stack)

### ✨ Animation Presets
- FadeIn/Out, Slide, Scale
- Stagger & Cascade animations
- Hover effects & Micro-interactions
- Page transitions

### 🎭 Theme Management
- 7 color theme system (green, orange, blue, red, gray, purple, pink)
- Dark mode support
- CSS variable generation
- Design token management

### 🤖 Intelligent Features
- Auto-detects project structure
- Follows best practices
- TypeScript-first
- Accessible by default

## Commands

### `/ui:create-component [name] [type]`
Creates a new React component with TypeScript and Tailwind styling.

**Examples:**
```
/ui:create-component StatCard kpi
/ui:create-component UserProfile form
/ui:create-component MetricWidget dashboard
```

### `/ui:add-animation [file-path] [animation-type]`
Adds Framer Motion animations to an existing component.

**Examples:**
```
/ui:add-animation src/components/Card.tsx fadeIn
/ui:add-animation src/app/page.tsx stagger
```

### `/ui:create-theme [theme-name] [base-color]`
Generates a complete color theme with CSS variables.

**Examples:**
```
/ui:create-theme ocean blue
/ui:create-theme sunset orange
```

### `/ui:add-variant [file-path] [variant-name]`
Adds a new variant to an existing component using class-variance-authority.

**Examples:**
```
/ui:add-variant src/components/ui/button.tsx ghost
```

### `/ui:generate-kpi-card [title] [icon] [color-theme]`
Generates a KPI card component ready to use.

**Examples:**
```
/ui:generate-kpi-card "Active Users" Users blue
```

### `/ui:generate-widget [widget-type] [name]`
Creates a dashboard widget component.

**Examples:**
```
/ui:generate-widget chart SalesChart
/ui:generate-widget table UserTable
```

## Agents

### Component Builder
Automatically triggers when you need to create UI components. Handles:
- Component file creation
- TypeScript interfaces
- Tailwind styling
- Export setup

### Theme Designer
Activates for theme and color-related tasks. Manages:
- Color palette generation
- CSS variable creation
- Dark mode variants
- Accessibility checks

### Animation Composer
Handles all animation-related tasks. Creates:
- Framer Motion variants
- CSS keyframes
- Performance optimization
- Reduced motion support

## Skills

### UI Components
Expert knowledge on React component patterns, Radix UI integration, and composition.

### Animations
Comprehensive guide to Framer Motion and CSS animations.

### Themes
Deep knowledge of design tokens, color systems, and theming.

### Tailwind v4
Specialized knowledge of Tailwind CSS v4 features and patterns.

## Installation

This plugin is project-specific and auto-loads when Claude Code runs in this project.

## Configuration

Create `.claude/ui-studio.local.md` to customize settings:

```markdown
# UI Studio Settings

## Preferences
- Component style: functional
- TypeScript strict: true
- Animation preference: framer-motion
- Default theme: light
- Icon library: lucide-react

## Project Patterns
- Component directory: src/components/ui
- Theme file: src/app/globals.css
- Animation file: src/styles/animations.css

## Auto-generate
- Tests: false
- Storybook: false
- Documentation: true
```

## Examples

See the `examples/` directory for:
- Sample components
- Animation patterns
- Theme configurations

## Templates

Pre-built templates available in `templates/`:
- KPI cards
- Form components
- Dashboard widgets
- Layout components

## License

MIT

## Author

UI Studio Plugin
