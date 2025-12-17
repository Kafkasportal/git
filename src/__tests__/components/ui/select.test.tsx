import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
  SelectTrigger,
} from '@/components/ui/select'

describe('Select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders select trigger', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders trigger with custom placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Select item')).toBeInTheDocument()
    })

    it('renders all select items', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
        expect(screen.getByText('Option 3')).toBeInTheDocument()
      })
    })

    it('renders with disabled state', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('renders with custom size', () => {
      render(
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Small" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('data-size', 'sm')
    })
  })

  describe('User Interaction', () => {
    it('opens menu on click', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeVisible()
      })
    })

    it('closes menu when item is selected', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
      })

      const item = screen.getByRole('option', { name: 'Option 1' })
      await user.click(item)

      expect(handleChange).toHaveBeenCalledWith('opt1')
    })

    it('selects item and shows value', async () => {
      const user = userEvent.setup()
      render(
        <Select defaultValue="opt1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">First Option</SelectItem>
            <SelectItem value="opt2">Second Option</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('First Option')).toBeInTheDocument()
    })

    it('cycles through items with arrow keys', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Option 1' })).toHaveFocus()
      })

      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Option 2' })).toHaveFocus()
      })
    })

    it('selects item with Enter key', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      expect(handleChange).toHaveBeenCalledWith('opt1')
    })

    it('escapes menu with Escape key', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeVisible()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeVisible()
      })
    })
  })

  describe('SelectGroup', () => {
    it('renders grouped items with label', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="lettuce">Lettuce</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Fruits')).toBeInTheDocument()
        expect(screen.getByText('Vegetables')).toBeInTheDocument()
      })
    })

    it('selects items from different groups', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      const carrot = screen.getByRole('option', { name: 'Carrot' })
      await user.click(carrot)

      expect(handleChange).toHaveBeenCalledWith('carrot')
    })
  })

  describe('Disabled Items', () => {
    it('cannot select disabled item', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2" disabled>
              Option 2
            </SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      const disabledOption = screen.getByRole('option', { name: 'Option 2' })
      expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Value Changes', () => {
    it('calls onValueChange callback when value changes', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      const { rerender } = render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      const option = screen.getByRole('option', { name: 'Option 1' })
      await user.click(option)

      expect(handleChange).toHaveBeenCalledWith('opt1')
    })

    it('updates value when controlled', async () => {
      const { rerender } = render(
        <Select value="opt1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()

      rerender(
        <Select value="opt2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')

      await user.click(trigger)
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await user.keyboard('{ArrowDown}{ArrowDown}')
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Option 2' })).toHaveFocus()
      })
    })
  })

  describe('Edge Cases', () => {
    it('renders empty select gracefully', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="No options" />
          </SelectTrigger>
          <SelectContent></SelectContent>
        </Select>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('handles very long option text', async () => {
      const user = userEvent.setup()
      const longText = 'This is a very long option text that might break the layout'

      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">{longText}</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('handles special characters in values', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt@1#">Special: @#</SelectItem>
            <SelectItem value="opt$2%">Special: $%</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      const specialOption = screen.getByRole('option', { name: /Special: @#/ })
      await user.click(specialOption)

      expect(handleChange).toHaveBeenCalledWith('opt@1#')
    })

    it('handles many items efficiently', async () => {
      const user = userEvent.setup()
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        value: `opt${i}`,
        label: `Option ${i}`,
      }))

      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {manyItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      const firstOption = screen.getByRole('option', { name: 'Option 0' })
      expect(firstOption).toBeInTheDocument()

      const lastOption = screen.getByRole('option', { name: 'Option 49' })
      expect(lastOption).toBeInTheDocument()
    })
  })
})
