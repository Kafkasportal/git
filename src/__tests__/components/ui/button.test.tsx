/**
 * Tests for Button UI component
 * Validates button rendering, interaction, and styling
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('renders button with children', () => {
      render(<Button>Test Button</Button>)
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('renders as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('renders as enabled by default', () => {
      render(<Button>Enabled Button</Button>)
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  describe('Variants', () => {
    it('renders with default variant', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('renders with primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('destructive')
    })

    it('renders with outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('outline')
    })

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('ghost')
    })

    it('renders with link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('link')
    })
  })

  describe('Sizes', () => {
    it('renders with default size', () => {
      render(<Button>Default Size</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with sm size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('sm')
    })

    it('renders with lg size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('lg')
    })

    it('renders with icon size', () => {
      render(<Button size="icon">🔍</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('icon')
    })
  })

  describe('Interaction', () => {
    it('handles click events', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={onClick}>Click me</Button>)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button onClick={onClick} disabled>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button')
      await user.click(button)

      expect(onClick).not.toHaveBeenCalled()
    })

    it('handles multiple clicks', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={onClick}>Click me</Button>)

      const button = screen.getByRole('button')
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(onClick).toHaveBeenCalledTimes(3)
    })

    it('supports keyboard interaction (Enter)', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={onClick}>Press Enter</Button>)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(onClick).toHaveBeenCalled()
    })

    it('supports keyboard interaction (Space)', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={onClick}>Press Space</Button>)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('HTML Attributes', () => {
    it('accepts type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('accepts className prop', () => {
      render(<Button className="custom-class">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('accepts aria-label', () => {
      render(<Button aria-label="Action button">🎬</Button>)
      expect(screen.getByRole('button', { name: 'Action button' })).toBeInTheDocument()
    })

    it('accepts data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>)
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    })

    it('accepts title attribute', () => {
      render(<Button title="This is a button">Hover</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('title', 'This is a button')
    })
  })

  describe('Content', () => {
    it('renders text content', () => {
      render(<Button>Text Content</Button>)
      expect(screen.getByText('Text Content')).toBeInTheDocument()
    })

    it('renders with icon and text', () => {
      render(
        <Button>
          <span>🔍</span> Search
        </Button>
      )
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    it('renders with only icon', () => {
      render(<Button size="icon">🔍</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles empty button', () => {
      render(<Button />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders long text content', () => {
      const longText =
        'This is a very long button text that might wrap to multiple lines'
      render(<Button>{longText}</Button>)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('shows focus state', async () => {
      const user = userEvent.setup()
      render(<Button>Focus me</Button>)

      const button = screen.getByRole('button')
      await user.tab()

      expect(button).toHaveFocus()
    })

    it('removes focus when tab away', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      )

      const buttons = screen.getAllByRole('button')
      await user.tab()
      expect(buttons[0]).toHaveFocus()

      await user.tab()
      expect(buttons[1]).toHaveFocus()
    })

    it('maintains hover state', async () => {
      const user = userEvent.setup()
      render(<Button>Hover me</Button>)

      const button = screen.getByRole('button')
      await user.hover(button)

      expect(button).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={onClick}>Accessible Button</Button>)

      const button = screen.getByRole('button')
      await user.tab()
      expect(button).toHaveFocus()
    })

    it('announces disabled state to assistive technology', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('has proper semantic role', () => {
      render(<Button>Semantic Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports aria-pressed for toggle buttons', () => {
      render(<Button aria-pressed="false">Toggle</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    })

    it('supports aria-label for icon buttons', () => {
      render(<Button aria-label="Close dialog">×</Button>)
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid clicks', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<Button onClick={onClick}>Rapid Click</Button>)

      const button = screen.getByRole('button')
      await user.click(button)
      await user.click(button)
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(onClick).toHaveBeenCalledTimes(5)
    })

    it('preserves styling after multiple clicks', async () => {
      const user = userEvent.setup()
      render(<Button variant="destructive">Delete</Button>)

      const button = screen.getByRole('button')
      const originalClass = button.className

      await user.click(button)
      await user.click(button)

      expect(button.className).toBe(originalClass)
    })
  })
})
