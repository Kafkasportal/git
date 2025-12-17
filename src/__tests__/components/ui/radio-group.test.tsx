import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

describe('RadioGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders radio group', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      expect(screen.getByRole('radio', { name: /option1/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /option2/i })).toBeInTheDocument()
    })

    it('renders with label elements', () => {
      render(
        <RadioGroup>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RadioGroupItem value="option1" id="opt1" />
            <label htmlFor="opt1">Option 1</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RadioGroupItem value="option2" id="opt2" />
            <label htmlFor="opt2">Option 2</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByLabelText('Option 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument()
    })

    it('renders with default value', () => {
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      expect(screen.getByRole('radio', { checked: true })).toHaveAttribute(
        'value',
        'option1'
      )
    })

    it('renders with custom className on group', () => {
      const { container } = render(
        <RadioGroup className="custom-class">
          <RadioGroupItem value="option1" id="opt1" />
        </RadioGroup>
      )

      const group = container.querySelector('[data-slot="radio-group"]')
      expect(group).toHaveClass('custom-class')
    })

    it('renders multiple radio items', () => {
      render(
        <RadioGroup>
          {Array.from({ length: 5 }, (_, i) => (
            <RadioGroupItem
              key={i}
              value={`option${i}`}
              id={`opt${i}`}
            />
          ))}
        </RadioGroup>
      )

      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(5)
    })
  })

  describe('User Interaction', () => {
    it('selects radio item on click', async () => {
      const user = userEvent.setup()
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio1 = screen.getByRole('radio', { name: /option1/i })
      await user.click(radio1)

      expect(radio1).toBeChecked()
    })

    it('deselects previous and selects new option', async () => {
      const user = userEvent.setup()
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
          <RadioGroupItem value="option3" id="opt3" />
        </RadioGroup>
      )

      const radio1 = screen.getByRole('radio', { name: /option1/i })
      const radio2 = screen.getByRole('radio', { name: /option2/i })

      expect(radio1).toBeChecked()
      expect(radio2).not.toBeChecked()

      await user.click(radio2)

      expect(radio1).not.toBeChecked()
      expect(radio2).toBeChecked()
    })

    it('calls onValueChange callback', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio = screen.getByRole('radio', { name: /option2/i })
      await user.click(radio)

      expect(handleChange).toHaveBeenCalledWith('option2')
    })

    it('navigates with arrow keys', async () => {
      const user = userEvent.setup()
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
          <RadioGroupItem value="option3" id="opt3" />
        </RadioGroup>
      )

      const radio1 = screen.getByRole('radio', { name: /option1/i })
      radio1.focus()

      await user.keyboard('{ArrowDown}')
      const radio2 = screen.getByRole('radio', { name: /option2/i })
      expect(radio2).toHaveFocus()

      await user.keyboard('{ArrowRight}')
      const radio3 = screen.getByRole('radio', { name: /option3/i })
      expect(radio3).toHaveFocus()
    })

    it('selects with Enter key', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio = screen.getByRole('radio', { name: /option1/i })
      radio.focus()

      await user.keyboard('{Enter}')
      expect(radio).toBeChecked()
    })

    it('selects with Space key', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio = screen.getByRole('radio', { name: /option2/i })
      radio.focus()

      await user.keyboard(' ')
      expect(radio).toBeChecked()
    })

    it('wraps around on arrow key navigation', async () => {
      const user = userEvent.setup()
      render(
        <RadioGroup defaultValue="option3">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
          <RadioGroupItem value="option3" id="opt3" />
        </RadioGroup>
      )

      const radio3 = screen.getByRole('radio', { name: /option3/i })
      radio3.focus()

      await user.keyboard('{ArrowDown}')
      const radio1 = screen.getByRole('radio', { name: /option1/i })
      expect(radio1).toHaveFocus()
    })
  })

  describe('Controlled Behavior', () => {
    it('updates when value prop changes', () => {
      const { rerender } = render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      expect(screen.getByRole('radio', { name: /option1/i })).toBeChecked()
      expect(screen.getByRole('radio', { name: /option2/i })).not.toBeChecked()

      rerender(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      expect(screen.getByRole('radio', { name: /option1/i })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: /option2/i })).toBeChecked()
    })

    it('maintains controlled state through onChange', async () => {
      const user = userEvent.setup()
      let value = 'option1'
      const handleChange = vi.fn((val) => {
        value = val
      })

      const { rerender } = render(
        <RadioGroup value={value} onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio2 = screen.getByRole('radio', { name: /option2/i })
      await user.click(radio2)

      expect(handleChange).toHaveBeenCalledWith('option2')

      rerender(
        <RadioGroup value="option2" onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      expect(screen.getByRole('radio', { name: /option2/i })).toBeChecked()
    })
  })

  describe('Disabled State', () => {
    it('disables entire group', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup disabled onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio = screen.getByRole('radio', { name: /option1/i })
      await user.click(radio)

      expect(handleChange).not.toHaveBeenCalled()
    })

    it('disables individual radio items', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" disabled />
        </RadioGroup>
      )

      const radio2 = screen.getByRole('radio', { name: /option2/i })
      expect(radio2).toBeDisabled()

      await user.click(radio2)
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Form Integration', () => {
    it('works with form submission', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn((e) => e.preventDefault())

      render(
        <form onSubmit={handleSubmit}>
          <RadioGroup name="options" defaultValue="option1">
            <RadioGroupItem value="option1" id="opt1" />
            <RadioGroupItem value="option2" id="opt2" />
          </RadioGroup>
          <button type="submit">Submit</button>
        </form>
      )

      await user.click(screen.getByText('Submit'))
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('includes value in FormData', async () => {
      const user = userEvent.setup()
      let formValue = ''

      render(
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            formValue = formData.get('choice') as string
          }}
        >
          <RadioGroup name="choice" defaultValue="A">
            <RadioGroupItem value="A" id="optA" />
            <RadioGroupItem value="B" id="optB" />
          </RadioGroup>
          <button type="submit">Submit</button>
        </form>
      )

      await user.click(screen.getByText('Submit'))
      expect(formValue).toBe('A')
    })
  })

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <RadioGroup aria-label="Choose option">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radios = screen.getAllByRole('radio')
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute('role', 'radio')
      })
    })

    it('supports aria-label on items', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" aria-label="First option" />
          <RadioGroupItem value="option2" id="opt2" aria-label="Second option" />
        </RadioGroup>
      )

      expect(screen.getByRole('radio', { name: 'First option' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Second option' })).toBeInTheDocument()
    })

    it('supports label association', () => {
      render(
        <RadioGroup>
          <div>
            <RadioGroupItem value="yes" id="yes-option" />
            <label htmlFor="yes-option">Yes</label>
          </div>
          <div>
            <RadioGroupItem value="no" id="no-option" />
            <label htmlFor="no-option">No</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByLabelText('Yes')).toHaveValue('yes')
      expect(screen.getByLabelText('No')).toHaveValue('no')
    })

    it('supports aria-describedby', () => {
      render(
        <div>
          <RadioGroup>
            <RadioGroupItem value="option1" id="opt1" aria-describedby="desc" />
          </RadioGroup>
          <p id="desc">This is a description</p>
        </div>
      )

      expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'desc')
    })

    it('maintains focus management', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <button>Before</button>
          <RadioGroup>
            <RadioGroupItem value="option1" id="opt1" />
            <RadioGroupItem value="option2" id="opt2" />
          </RadioGroup>
          <button>After</button>
        </div>
      )

      const buttons = screen.getAllByRole('button')
      const radios = screen.getAllByRole('radio')

      await user.click(buttons[0])
      await user.tab()

      expect(radios[0]).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid selections', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
          <RadioGroupItem value="option3" id="opt3" />
        </RadioGroup>
      )

      const radio1 = screen.getByRole('radio', { name: /option1/i })
      const radio2 = screen.getByRole('radio', { name: /option2/i })
      const radio3 = screen.getByRole('radio', { name: /option3/i })

      await user.click(radio1)
      await user.click(radio2)
      await user.click(radio3)

      expect(handleChange).toHaveBeenCalledTimes(3)
      expect(radio3).toBeChecked()
    })

    it('handles long labels', () => {
      const longLabel = 'This is a very long label for a radio option that might wrap'

      render(
        <RadioGroup>
          <div>
            <RadioGroupItem value="long" id="long-option" />
            <label htmlFor="long-option">{longLabel}</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByLabelText(longLabel)).toBeInTheDocument()
    })

    it('handles special characters in values', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option@1#" id="opt1" />
          <RadioGroupItem value="option$2%" id="opt2" />
        </RadioGroup>
      )

      const radio = document.getElementById('opt1') as HTMLInputElement
      await user.click(radio)

      expect(handleChange).toHaveBeenCalledWith('option@1#')
    })

    it('handles empty group gracefully', () => {
      render(<RadioGroup></RadioGroup>)
      expect(document.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('handles selected state with form reset', async () => {
      const user = userEvent.setup()

      render(
        <form>
          <RadioGroup name="option" defaultValue="yes">
            <RadioGroupItem value="yes" id="yes-opt" />
            <RadioGroupItem value="no" id="no-opt" />
          </RadioGroup>
          <button type="reset">Reset</button>
        </form>
      )

      const radio = screen.getByRole('radio', { name: /yes/i })
      expect(radio).toBeChecked()

      const noRadio = screen.getByRole('radio', { name: /no/i })
      await user.click(noRadio)
      expect(noRadio).toBeChecked()

      await user.click(screen.getByText('Reset'))
      expect(radio).toBeChecked()
      expect(noRadio).not.toBeChecked()
    })
  })

  describe('Visual States', () => {
    it('shows correct state indicators', () => {
      const { rerender } = render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      const radio1 = document.getElementById('opt1')
      const radio2 = document.getElementById('opt2')

      expect(radio1).toHaveAttribute('data-state', 'checked')
      expect(radio2).toHaveAttribute('data-state', 'unchecked')

      rerender(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" id="opt1" />
          <RadioGroupItem value="option2" id="opt2" />
        </RadioGroup>
      )

      expect(radio1).toHaveAttribute('data-state', 'unchecked')
      expect(radio2).toHaveAttribute('data-state', 'checked')
    })
  })
})
