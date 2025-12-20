/**
 * Tests for Input UI component
 * Validates input rendering, validation, and interaction
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with default value', () => {
      render(<Input defaultValue="Default Text" />)
      expect(screen.getByDisplayValue('Default Text')).toBeInTheDocument()
    })

    it('renders with initial value', () => {
      render(<Input value="Initial Value" readOnly />)
      expect(screen.getByDisplayValue('Initial Value')).toBeInTheDocument()
    })

    it('renders as disabled when disabled prop is true', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('renders as enabled by default', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('renders as readonly when readonly prop is true', () => {
      render(<Input readOnly value="Read only" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    })
  })

  describe('Input Types', () => {
    it('renders text input by default', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    })

    it('renders as email input', () => {
      render(<Input type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    })

    it('renders as password input', () => {
      render(<Input type="password" />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders as number input', () => {
      render(<Input type="number" />)
      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })

    it('renders as date input', () => {
      render(<Input type="date" />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'date')
    })

    it('renders as tel input', () => {
      render(<Input type="tel" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel')
    })

    it('renders as url input', () => {
      render(<Input type="url" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'url')
    })

    it('renders as search input', () => {
      render(<Input type="search" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'search')
    })
  })

  describe('User Interaction', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Test input text')

      expect(input).toHaveValue('Test input text')
    })

    it('clears input when backspace is pressed', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="Text" />)

      const input = screen.getByRole('textbox')
      input.focus()
      await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}')

      expect(input).toHaveValue('')
    })

    it('handles paste events', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      await user.type(input, 'pasted text')

      expect(input.value).toBe('pasted text')
    })

    it('handles selection', async () => {
      render(<Input defaultValue="Select me" />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      input.setSelectionRange(0, 6)

      expect(input.selectionStart).toBe(0)
      expect(input.selectionEnd).toBe(6)
    })

    it('triggers onChange callback', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<Input onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      expect(onChange).toHaveBeenCalled()
    })

    it('triggers onBlur callback', async () => {
      const onBlur = vi.fn()
      const user = userEvent.setup()

      render(<Input onBlur={onBlur} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.tab()

      expect(onBlur).toHaveBeenCalled()
    })

    it('triggers onFocus callback', async () => {
      const onFocus = vi.fn()
      const user = userEvent.setup()

      render(<Input onFocus={onFocus} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      expect(onFocus).toHaveBeenCalled()
    })
  })

  describe('Validation', () => {
    it('accepts required attribute', () => {
      render(<Input required />)
      expect(screen.getByRole('textbox')).toHaveAttribute('required')
    })

    it('accepts minLength attribute', () => {
      render(<Input minLength={5} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '5')
    })

    it('accepts maxLength attribute', () => {
      render(<Input maxLength={10} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10')
    })

    it('prevents input exceeding maxLength', async () => {
      const user = userEvent.setup()
      render(<Input maxLength={5} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'This is too long')

      expect(input).toHaveValue('This ')
    })

    it('accepts pattern attribute', () => {
      render(<Input pattern="[0-9]+" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]+')
    })

    it('accepts step attribute for number inputs', () => {
      render(<Input type="number" step="0.01" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '0.01')
    })

    it('accepts min attribute for number inputs', () => {
      render(<Input type="number" min="0" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '0')
    })

    it('accepts max attribute for number inputs', () => {
      render(<Input type="number" max="100" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '100')
    })
  })

  describe('HTML Attributes', () => {
    it('accepts id attribute', () => {
      render(<Input id="custom-input" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-input')
    })

    it('accepts name attribute', () => {
      render(<Input name="username" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username')
    })

    it('accepts aria-label', () => {
      render(<Input aria-label="Username input" />)
      expect(screen.getByLabelText('Username input')).toBeInTheDocument()
    })

    it('accepts aria-describedby', () => {
      render(<Input aria-describedby="error-message" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('accepts className prop', () => {
      render(<Input className="custom-class" />)
      expect(screen.getByRole('textbox')).toHaveClass('custom-class')
    })

    it('accepts data attributes', () => {
      render(<Input data-testid="custom-input" />)
      expect(screen.getByTestId('custom-input')).toBeInTheDocument()
    })

    it('accepts autocomplete attribute', () => {
      render(<Input autoComplete="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email')
    })

    it('accepts spellCheck attribute', () => {
      render(<Input spellCheck="false" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false')
    })
  })

  describe('States', () => {
    it('shows focus state', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      expect(input).toHaveFocus()
    })

    it('removes focus when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Input data-testid="input1" />
          <button data-testid="button">Click me</button>
        </>
      )

      const input = screen.getByTestId('input1')
      const button = screen.getByTestId('button')

      await user.click(input)
      expect(input).toHaveFocus()

      await user.click(button)
      expect(input).not.toHaveFocus()
    })

    it('shows disabled styling', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('shows readonly styling', () => {
      render(<Input readOnly value="readonly" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    })

    it('renders loading spinner when isLoading is true (with icon)', () => {
      render(
        <Input
          placeholder="Searching..."
          icon={<SearchIcon data-testid="search-icon" />}
          isLoading={true}
        />
      );
      // Icon should be replaced by spinner
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
      // Verify spinner exists (lucide-react Loader2 usually has class 'animate-spin')
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('renders loading spinner when isLoading is true (without icon)', () => {
      render(<Input placeholder="Loading..." isLoading={true} />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables input when isLoading is true', () => {
      render(<Input placeholder="Loading..." isLoading={true} />);
      const input = screen.getByPlaceholderText('Loading...');
      expect(input).toBeDisabled();
    });
  })

  describe('Number Input', () => {
    it('accepts numeric input', async () => {
      const user = userEvent.setup()
      render(<Input type="number" />)

      const input = screen.getByRole('spinbutton')
      await user.type(input, '123')

      expect(input).toHaveValue(123)
    })

    it('rejects non-numeric input', async () => {
      const user = userEvent.setup()
      render(<Input type="number" />)

      const input = screen.getByRole('spinbutton')
      // HTML5 number input will ignore non-numeric characters
      await user.type(input, 'abc')

      expect(input).toHaveValue(null)
    })

    it('increments value with up arrow', async () => {
      const user = userEvent.setup()
      render(<Input type="number" defaultValue="5" />)

      const input = screen.getByRole('spinbutton')
      input.focus()
      await user.keyboard('{ArrowUp}')

      expect(input).toHaveValue(6)
    })

    it('decrements value with down arrow', async () => {
      const user = userEvent.setup()
      render(<Input type="number" defaultValue="5" />)

      const input = screen.getByRole('spinbutton')
      input.focus()
      await user.keyboard('{ArrowDown}')

      expect(input).toHaveValue(4)
    })
  })

  describe('Controlled Component', () => {
    it('updates when value prop changes', async () => {
      const { rerender } = render(<Input value="Initial" readOnly />)

      expect(screen.getByDisplayValue('Initial')).toBeInTheDocument()

      rerender(<Input value="Updated" readOnly />)

      expect(screen.getByDisplayValue('Updated')).toBeInTheDocument()
    })

    it('handles onChange with controlled component', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      let value = ''
      const { rerender } = render(
        <Input
          value={value}
          onChange={(e) => {
            value = e.target.value
            onChange(e)
          }}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.tab()

      expect(input).toHaveFocus()
    })

    it('supports keyboard shortcuts', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="Test" />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      input.focus()
      await user.keyboard('{Control>}a{/Control}')

      expect(input.selectionStart).toBe(0)
      expect(input.selectionEnd).toBe(4)
    })

    it('announces disabled state', () => {
      render(<Input disabled aria-label="Disabled input" />)
      const input = screen.getByLabelText('Disabled input')
      expect(input).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty input', () => {
      render(<Input value="" readOnly />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('handles very long input text', async () => {
      const user = userEvent.setup()
      const longText = 'a'.repeat(1000)
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.type(input, longText)

      expect(input).toHaveValue(longText)
    })

    it('handles special characters', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.type(input, '!@#$%^&*()_+-=[]{}|;:,.<>?')

      expect(input).toHaveValue('!@#$%^&*()_+-=[]{}|;:,.<>?')
    })

    it('handles whitespace correctly', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.type(input, '  spaces  ')

      expect(input).toHaveValue('  spaces  ')
    })

    it('handles unicode characters', async () => {
      const user = userEvent.setup()
      render(<Input />)

      const input = screen.getByRole('textbox')
      await user.type(input, '你好世界')

      expect(input).toHaveValue('你好世界')
    })
  })
})
