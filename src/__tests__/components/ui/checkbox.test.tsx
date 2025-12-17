import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders checkbox', () => {
      render(<Checkbox />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('renders unchecked by default', () => {
      render(<Checkbox />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('renders with aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />)
      expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<Checkbox className="custom-class" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('custom-class')
    })

    it('renders in checked state', () => {
      render(<Checkbox checked={true} />)
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('renders in indeterminate state', () => {
      render(<Checkbox checked="indeterminate" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
    })

    it('renders disabled checkbox', () => {
      render(<Checkbox disabled />)
      expect(screen.getByRole('checkbox')).toBeDisabled()
    })

    it('renders with id attribute', () => {
      render(<Checkbox id="terms-checkbox" />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'terms-checkbox')
    })

    it('renders with name attribute', () => {
      render(<Checkbox name="agreement" />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'agreement')
    })
  })

  describe('User Interaction', () => {
    it('toggles checked state on click', async () => {
      const user = userEvent.setup()
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('calls onCheckedChange callback', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(<Checkbox onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalledWith(true)

      await user.click(checkbox)
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('handles indeterminate to checked transition', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(<Checkbox checked="indeterminate" onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalled()
    })

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(<Checkbox disabled onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).not.toHaveBeenCalled()
    })

    it('toggles with keyboard Space key', async () => {
      const user = userEvent.setup()
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      await user.keyboard(' ')
      expect(checkbox).toBeChecked()

      await user.keyboard(' ')
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('Controlled Behavior', () => {
    it('updates when checked prop changes', () => {
      const { rerender } = render(<Checkbox checked={false} />)
      expect(screen.getByRole('checkbox')).not.toBeChecked()

      rerender(<Checkbox checked={true} />)
      expect(screen.getByRole('checkbox')).toBeChecked()

      rerender(<Checkbox checked={false} />)
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('maintains controlled state', async () => {
      const user = userEvent.setup()
      let value = false
      const handleChange = vi.fn((checked) => {
        value = checked as boolean
      })

      const { rerender } = render(
        <Checkbox checked={value} onCheckedChange={handleChange} />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(handleChange).toHaveBeenCalledWith(true)

      rerender(<Checkbox checked={true} onCheckedChange={handleChange} />)
      expect(screen.getByRole('checkbox')).toBeChecked()
    })
  })

  describe('Form Integration', () => {
    it('works with form submission', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn((e) => e.preventDefault())

      render(
        <form onSubmit={handleSubmit}>
          <Checkbox name="agree" value="yes" />
          <button type="submit">Submit</button>
        </form>
      )

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      await user.click(screen.getByText('Submit'))

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('can be used in a form with FormData', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn((e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        return Object.fromEntries(formData)
      })

      render(
        <form onSubmit={handleSubmit}>
          <Checkbox name="notifications" defaultChecked={true} />
          <button type="submit">Save</button>
        </form>
      )

      const submitButton = screen.getByText('Save')
      await user.click(submitButton)

      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<Checkbox aria-label="Accept terms" />)
      const checkbox = screen.getByRole('checkbox')

      expect(checkbox).toHaveAttribute('role', 'checkbox')
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms')
    })

    it('supports aria-labelledby', () => {
      render(
        <div>
          <label id="check-label">Terms and conditions</label>
          <Checkbox aria-labelledby="check-label" />
        </div>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-labelledby', 'check-label')
    })

    it('supports aria-describedby', () => {
      render(
        <div>
          <Checkbox aria-describedby="desc" />
          <p id="desc">This is a description</p>
        </div>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-describedby', 'desc')
    })

    it('announces checked state to screen readers', () => {
      const { rerender } = render(
        <Checkbox aria-label="Subscribe to newsletter" checked={false} />
      )

      const checkbox = screen.getByRole('checkbox', { name: 'Subscribe to newsletter' })
      expect(checkbox).not.toBeChecked()

      rerender(
        <Checkbox aria-label="Subscribe to newsletter" checked={true} />
      )

      expect(checkbox).toBeChecked()
    })

    it('prevents keyboard focus when disabled', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Checkbox />
          <Checkbox disabled />
          <Checkbox />
        </div>
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.tab()
      expect(checkboxes[0]).toHaveFocus()

      await user.tab()
      expect(checkboxes[2]).toHaveFocus()
    })
  })

  describe('Visual States', () => {
    it('shows checked indicator when checked', () => {
      const { rerender } = render(<Checkbox checked={false} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')

      rerender(<Checkbox checked={true} />)
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('applies correct styling for different states', () => {
      const { rerender } = render(<Checkbox checked={false} />)

      let checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toHaveClass('data-[state=checked]:bg-primary')

      rerender(<Checkbox checked={true} />)
      checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()

      rerender(<Checkbox disabled />)
      checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid clicks', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(<Checkbox onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')

      await user.click(checkbox)
      await user.click(checkbox)
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalledTimes(3)
      expect(checkbox).toBeChecked()
    })

    it('handles value prop correctly', () => {
      render(<Checkbox value="custom-value" />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('value', 'custom-value')
    })

    it('handles required attribute', () => {
      render(<Checkbox required />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('required')
    })

    it('handles aria-invalid for form validation', () => {
      render(<Checkbox aria-invalid="true" />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('maintains state through re-renders', async () => {
      const user = userEvent.setup()

      const TestComponent = () => {
        const [rerender, setRerender] = React.useState(false)
        return (
          <>
            <Checkbox defaultChecked={true} />
            <button onClick={() => setRerender(!rerender)}>Trigger</button>
          </>
        )
      }

      render(<TestComponent />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()

      await user.click(screen.getByText('Trigger'))
      expect(checkbox).toBeChecked()
    })

    it('handles multiple checkboxes independently', async () => {
      const user = userEvent.setup()

      render(
        <div>
          <Checkbox aria-label="Option 1" />
          <Checkbox aria-label="Option 2" />
          <Checkbox aria-label="Option 3" />
        </div>
      )

      const checkboxes = screen.getAllByRole('checkbox')

      await user.click(checkboxes[0])
      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[1]).not.toBeChecked()
      expect(checkboxes[2]).not.toBeChecked()

      await user.click(checkboxes[2])
      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[1]).not.toBeChecked()
      expect(checkboxes[2]).toBeChecked()
    })
  })

  describe('Data Attributes', () => {
    it('has data-slot attribute', () => {
      render(<Checkbox />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox')
    })

    it('reflects state in data attributes', () => {
      const { rerender } = render(<Checkbox checked={false} />)

      let checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')

      rerender(<Checkbox checked={true} />)
      checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })
  })
})
