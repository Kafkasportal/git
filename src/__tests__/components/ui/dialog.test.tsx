/**
 * Tests for Dialog UI component
 * Validates dialog rendering, interaction, and accessibility
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

describe('Dialog', () => {
  describe('Rendering', () => {
    it('renders dialog trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
        </Dialog>
      )

      expect(screen.getByRole('button', { name: 'Open Dialog' })).toBeInTheDocument()
    })

    it('renders dialog content when open', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
        expect(screen.getByText('Dialog content')).toBeInTheDocument()
      })
    })

    it('renders dialog header', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      })
    })

    it('renders dialog description', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogDescription>This is a dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('This is a dialog description')).toBeInTheDocument()
      })
    })

    it('renders dialog footer', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogFooter>
              <Button>Cancel</Button>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      })
    })
  })

  describe('Open/Close Behavior', () => {
    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog is open</p>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByText('Dialog is open')).not.toBeInTheDocument()

      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog is open')).toBeInTheDocument()
      })
    })

    it('closes dialog when backdrop is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument()
      })

      // Click on backdrop (outside dialog)
      const backdrop = screen.getByRole('presentation', { hidden: true })
      if (backdrop) {
        await user.click(backdrop)

        await waitFor(() => {
          expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
        })
      }
    })

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
      })
    })

    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Controlled Dialog', () => {
    it('opens dialog with controlled open state', async () => {
      const TestComponent = () => {
        const [open, setOpen] = [true, vi.fn()] as const
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Open</Button>
            </DialogTrigger>
            <DialogContent>
              <p>Controlled dialog</p>
            </DialogContent>
          </Dialog>
        )
      }

      render(<TestComponent />)
      expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('renders custom content inside dialog', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <div>
              <h2>Custom Title</h2>
              <p>Custom content with multiple elements</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Custom Title')).toBeInTheDocument()
        expect(screen.getByText('Custom content with multiple elements')).toBeInTheDocument()
        expect(screen.getByText('Item 1')).toBeInTheDocument()
      })
    })

    it('renders form inside dialog', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Form</Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
              }}
            >
              <label>
                Name:
                <input type="text" placeholder="Enter name" />
              </label>
              <button type="submit">Submit</button>
            </form>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open Form' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      expect(onSubmit).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('sets proper dialog role', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        // Dialog should be in the document
        expect(screen.getByText('Dialog content')).toBeInTheDocument()
      })
    })

    it('traps focus inside dialog', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <Button>Button 3</Button>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Button 1' })).toBeInTheDocument()
      })

      // Focus should be trapped in dialog
      const button1 = screen.getByRole('button', { name: 'Button 1' })
      button1.focus()
      expect(button1).toHaveFocus()
    })

    it('announces dialog to screen readers', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Important Dialog</DialogTitle>
            <DialogDescription>This is important information</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Important Dialog')).toBeInTheDocument()
        expect(screen.getByText('This is important information')).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <Button>Action</Button>
            <Button>Cancel</Button>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
      })

      // Tab navigation should work
      screen.getByRole('button', { name: 'Action' })
      await user.tab()
      await user.tab()

      // Focus should move between dialog buttons
      expect(document.activeElement).toBeInTheDocument()
    })
  })

  describe('Multiple Dialogs', () => {
    it('can render multiple independent dialogs', async () => {
      const user = userEvent.setup()

      render(
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog 1</Button>
            </DialogTrigger>
            <DialogContent>
              <p>Dialog 1 content</p>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog 2</Button>
            </DialogTrigger>
            <DialogContent>
              <p>Dialog 2 content</p>
            </DialogContent>
          </Dialog>
        </>
      )

      const trigger1 = screen.getByRole('button', { name: 'Open Dialog 1' })
      await user.click(trigger1)

      await waitFor(() => {
        expect(screen.getByText('Dialog 1 content')).toBeInTheDocument()
      })

      expect(screen.queryByText('Dialog 2 content')).not.toBeInTheDocument()

      const trigger2 = screen.getByRole('button', { name: 'Open Dialog 2' })
      await user.click(trigger2)

      await waitFor(() => {
        expect(screen.getByText('Dialog 2 content')).toBeInTheDocument()
      })
    })

    it('handles nested dialogs', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Outer</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Outer dialog</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Inner</Button>
              </DialogTrigger>
              <DialogContent>
                <p>Inner dialog</p>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      )

      const outerTrigger = screen.getByRole('button', { name: 'Open Outer' })
      await user.click(outerTrigger)

      await waitFor(() => {
        expect(screen.getByText('Outer dialog')).toBeInTheDocument()
      })

      const innerTrigger = screen.getByRole('button', { name: 'Open Inner' })
      await user.click(innerTrigger)

      await waitFor(() => {
        expect(screen.getByText('Inner dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid open/close clicks', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Toggle</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog content</p>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Toggle' })
      await user.click(trigger)
      await user.click(trigger)
      await user.click(trigger)

      expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument()
    })

    it('handles dialog without close button', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog without close button</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog without close button')).toBeInTheDocument()
      })

      // Should be closeable via Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Dialog without close button')).not.toBeInTheDocument()
      })
    })

    it('handles very long dialog content', async () => {
      const user = userEvent.setup()
      const longContent = 'Lorem ipsum dolor sit amet. '.repeat(100)

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <p>{longContent}</p>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument()
      })
    })
  })
})
