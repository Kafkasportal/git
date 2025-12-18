import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders tabs with all components', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('renders with multiple tab groups', () => {
      render(
        <div>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content 1</TabsContent>
          </Tabs>
          <Tabs defaultValue="tabA">
            <TabsList>
              <TabsTrigger value="tabA">Tab A</TabsTrigger>
            </TabsList>
            <TabsContent value="tabA">Content A</TabsContent>
          </Tabs>
        </div>
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab A')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tabs = container.querySelector('[data-slot="tabs"]')
      expect(tabs).toHaveClass('custom-tabs')
    })

    it('renders default active tab', () => {
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      expect(tab2).toHaveAttribute('data-state', 'active')
    })

    it('renders inactive tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      expect(tab2).toHaveAttribute('data-state', 'inactive')
    })

    it('renders many tabs', () => {
      render(
        <Tabs defaultValue="tab0">
          <TabsList>
            {Array.from({ length: 10 }, (_, i) => (
              <TabsTrigger key={i} value={`tab${i}`}>
                Tab {i}
              </TabsTrigger>
            ))}
          </TabsList>
          {Array.from({ length: 10 }, (_, i) => (
            <TabsContent key={i} value={`tab${i}`}>
              Content {i}
            </TabsContent>
          ))}
        </Tabs>
      )

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(10)
    })

    it('renders with icons in tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">
              📧 Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2">
              ⚙️ Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByText(/📧 Tab 1/)).toBeInTheDocument()
      expect(screen.getByText(/⚙️ Tab 2/)).toBeInTheDocument()
    })
  })

  describe('User Interaction', () => {
    it('switches tab on click', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      await user.click(tab2)

      expect(tab2).toHaveAttribute('data-state', 'active')
      expect(screen.getByText('Content 2')).toBeVisible()
    })

    it('shows only active tab content', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Content 1')).toBeInTheDocument()

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      await user.click(tab2)

      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })

    it('navigates with arrow keys', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      tab1.focus()

      await user.keyboard('{ArrowRight}')
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      expect(tab2).toHaveFocus()

      await user.keyboard('{ArrowRight}')
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' })
      expect(tab3).toHaveFocus()
    })

    it('wraps around on arrow key navigation', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab3">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab3 = screen.getByRole('tab', { name: 'Tab 3' })
      tab3.focus()

      await user.keyboard('{ArrowRight}')
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      expect(tab1).toHaveFocus()
    })

    it('selects tab with Enter key', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      tab2.focus()

      await user.keyboard('{Enter}')
      expect(tab2).toHaveAttribute('data-state', 'active')
      expect(screen.getByText('Content 2')).toBeVisible()
    })

    it('selects tab with Space key', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      tab2.focus()

      await user.keyboard(' ')
      expect(tab2).toHaveAttribute('data-state', 'active')
    })
  })

  describe('Controlled Behavior', () => {
    it('updates when value prop changes', () => {
      const { rerender } = render(
        <Tabs value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      expect(tab1).toHaveAttribute('data-state', 'active')

      rerender(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      expect(tab2).toHaveAttribute('data-state', 'active')
      expect(tab1).toHaveAttribute('data-state', 'inactive')
    })

    it('calls onValueChange callback', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Tabs defaultValue="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      await user.click(tab2)

      expect(handleChange).toHaveBeenCalledWith('tab2')
    })

    it('maintains controlled state through onChange', async () => {
      const user = userEvent.setup()
      let activeTab = 'tab1'
      const handleChange = vi.fn((val) => {
        activeTab = val
      })

      const { rerender } = render(
        <Tabs value={activeTab} onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      await user.click(tab2)

      expect(handleChange).toHaveBeenCalledWith('tab2')

      rerender(
        <Tabs value="tab2" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(tab2).toHaveAttribute('data-state', 'active')
    })
  })

  describe('Disabled Tabs', () => {
    it('disables individual tabs', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Tabs defaultValue="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      expect(tab2).toBeDisabled()

      await user.click(tab2)
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('skips disabled tabs in keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      tab1.focus()

      await user.keyboard('{ArrowRight}')
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' })
      expect(tab3).toHaveFocus()
    })
  })

  describe('Complex Content', () => {
    it('renders rich content in tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Settings</TabsTrigger>
            <TabsTrigger value="tab2">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <form>
              <input placeholder="Username" />
              <button>Save</button>
            </form>
          </TabsContent>
          <TabsContent value="tab2">
            <div>Advanced settings</div>
          </TabsContent>
        </Tabs>
      )

      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('preserves tab content when switching', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <input defaultValue="test-value" />
          </TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const input = screen.getByDisplayValue('test-value')
      expect(input).toBeInTheDocument()

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      await user.click(tab2)

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      await user.click(tab1)

      expect(screen.getByDisplayValue('test-value')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tabs = screen.getAllByRole('tab')
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('type', 'button')
      })

      const tabpanels = screen.getAllByRole('tabpanel')
      expect(tabpanels).toHaveLength(1)
    })

    it('associates content with tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tabpanel = screen.getByRole('tabpanel')
      expect(tabpanel).toHaveAttribute('data-state', 'active')
    })

    it('supports keyboard navigation for users', async () => {
      const user = userEvent.setup()
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      await user.tab()
      expect(tab1).toHaveFocus()

      await user.keyboard('{ArrowRight}{ArrowRight}')
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' })
      expect(tab3).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles single tab gracefully', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument()
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('handles missing content gracefully', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <Tabs defaultValue="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' })
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' })
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' })

      await user.click(tab2)
      await user.click(tab3)
      await user.click(tab1)

      expect(handleChange).toHaveBeenCalledTimes(3)
      expect(tab1).toHaveAttribute('data-state', 'active')
    })

    it('handles very long tab names', () => {
      const longName = 'This is a very long tab name that might cause layout issues'

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">{longName}</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByText(longName)).toBeInTheDocument()
    })
  })

  describe('Data Attributes', () => {
    it('has data-slot attributes', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument()
    })

    it('has data-state attributes reflecting state', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const activeTab = screen.getByRole('tab', { name: 'Tab 1' })
      const inactiveTab = screen.getByRole('tab', { name: 'Tab 2' })

      expect(activeTab).toHaveAttribute('data-state', 'active')
      expect(inactiveTab).toHaveAttribute('data-state', 'inactive')
    })
  })
})
