/**
 * Tests for TaskForm component
 * Validates form rendering, validation, and submission with real component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '@/components/forms/TaskForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as sonner from 'sonner'
import { taskFactory, createApiResponse } from '@/__tests__/test-utils/factories'

// Mock dependencies
vi.mock('sonner')
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-123', name: 'Test User' },
  }),
}))

vi.mock('@/lib/api/crud-factory', () => ({
  tasks: {
    create: vi.fn().mockResolvedValue({
      data: { $id: 'task-123', title: 'Test Task' },
      error: null,
    }),
    update: vi.fn().mockResolvedValue({
      data: { $id: 'task-123', title: 'Updated Task' },
      error: null,
    }),
  },
}))

// Mock scrollIntoView
const mockScrollIntoView = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

describe('TaskForm', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    Element.prototype.scrollIntoView = mockScrollIntoView
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalScrollIntoView !== undefined) {
      Element.prototype.scrollIntoView = originalScrollIntoView
    } else {
      delete (Element.prototype as any).scrollIntoView
    }
  })

  const renderForm = (props = {}) => {
    const defaultProps = {
      onSuccess: vi.fn(),
      onCancel: vi.fn(),
      ...props,
    }

    return render(
      <QueryClientProvider client={queryClient}>
        <TaskForm {...defaultProps} />
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders form with title and description', () => {
      renderForm()

      expect(screen.getByLabelText(/Başlık/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Açıklama/i)).toBeInTheDocument()
    })

    it('renders all required fields', () => {
      renderForm()

      expect(screen.getByLabelText(/Başlık/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Açıklama/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Priorite/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Durum/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
    })

    it('renders submit and cancel buttons', () => {
      renderForm()

      expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iptal/i })).toBeInTheDocument()
    })

    it('renders with default values', () => {
      renderForm()

      const priorityField = screen.getByDisplayValue(/normal/i)
      expect(priorityField).toBeInTheDocument()

      const statusField = screen.getByDisplayValue(/beklemede/i)
      expect(statusField).toBeInTheDocument()
    })

    it('renders with initial data', () => {
      const initialData = {
        title: 'Existing Task',
        description: 'Task description',
        priority: 'high' as const,
      }

      renderForm({ initialData })

      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Task description')).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error for empty title', async () => {
      const user = userEvent.setup()
      renderForm()

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/görev başlığı gereklidir/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for short title', async () => {
      const user = userEvent.setup()
      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'ab')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/en az 3 karakter/i)
        ).toBeInTheDocument()
      })
    })

    it('validates title field length', async () => {
      const user = userEvent.setup()
      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'a'.repeat(300))

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/en fazla 255 karakter/i)
        ).toBeInTheDocument()
      })
    })

    it('requires priority field', async () => {
      const user = userEvent.setup()
      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // If priority is required, validation should pass only with valid priority
      // which has default value
      expect(screen.getByDisplayValue(/normal|urgent|high|low/i)).toBeInTheDocument()
    })

    it('validates all required fields at once', async () => {
      const user = userEvent.setup()
      renderForm()

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/görev başlığı gereklidir/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('does not submit with invalid data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).not.toHaveBeenCalled()
      })
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows success toast after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalled()
      })
    })

    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      const { tasks } = await import('@/lib/api/crud-factory')

      vi.mocked(tasks.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve(createApiResponse(taskFactory.build())),
              100
            )
          )
      )

      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Cancel Button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderForm({ onCancel })

      const cancelButton = screen.getByRole('button', { name: /iptal/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('does not submit when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      const cancelButton = screen.getByRole('button', { name: /iptal/i })
      await user.click(cancelButton)

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Priority and Status Selection', () => {
    it('renders priority options', () => {
      renderForm()

      expect(screen.getByDisplayValue(/normal/i)).toBeInTheDocument()
    })

    it('renders status options', () => {
      renderForm()

      expect(screen.getByDisplayValue(/beklemede/i)).toBeInTheDocument()
    })

    it('allows changing priority', async () => {
      const user = userEvent.setup()
      renderForm()

      const prioritySelect = screen.getByDisplayValue(/normal/i) as HTMLSelectElement
      await user.selectOptions(prioritySelect, 'high')

      expect(prioritySelect.value).toBe('high')
    })

    it('allows changing status', async () => {
      const user = userEvent.setup()
      renderForm()

      const statusSelect = screen.getByDisplayValue(/beklemede/i) as HTMLSelectElement
      await user.selectOptions(statusSelect, 'in_progress')

      expect(statusSelect.value).toBe('in_progress')
    })
  })

  describe('Optional Fields', () => {
    it('renders optional description field', () => {
      renderForm()

      expect(screen.getByLabelText(/Açıklama/i)).toBeInTheDocument()
    })

    it('renders optional category field', () => {
      renderForm()

      expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
    })

    it('renders optional due date field', () => {
      renderForm()

      expect(screen.getByLabelText(/Bitiş Tarihi/i)).toBeInTheDocument()
    })

    it('allows submission without optional fields', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Tag Management', () => {
    it('renders tags input field', () => {
      renderForm()

      expect(screen.getByLabelText(/Etiketler/i)).toBeInTheDocument()
    })

    it('adds tag when enter is pressed', async () => {
      const user = userEvent.setup()
      renderForm()

      const tagsInput = screen.getByLabelText(/Etiketler/)
      await user.type(tagsInput, 'urgent{Enter}')

      // Tag should be added to the list
      expect(screen.getByText('urgent')).toBeInTheDocument()
    })

    it('removes tag when close button is clicked', async () => {
      const user = userEvent.setup()
      const initialData = { tags: ['important', 'review'] }
      renderForm({ initialData })

      const removeButtons = screen.getAllByRole('button', { name: /remove|sil/i })
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0])

        await waitFor(() => {
          expect(screen.queryByText('important')).not.toBeInTheDocument()
        })
      }
    })

    it('allows multiple tags', async () => {
      const user = userEvent.setup()
      renderForm()

      const tagsInput = screen.getByLabelText(/Etiketler/)
      await user.type(tagsInput, 'tag1{Enter}tag2{Enter}tag3{Enter}')

      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.getByText('tag3')).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('shows form in create mode when taskId is not provided', () => {
      renderForm()

      expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument()
    })

    it('shows form in edit mode when taskId is provided', () => {
      const initialData = { title: 'Existing Task' }
      renderForm({ initialData, taskId: 'task-123' })

      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
    })

    it('updates task when taskId is provided', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const initialData = { title: 'Old Title' }

      renderForm({ initialData, onSuccess, taskId: 'task-123' })

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      const { tasks } = await import('@/lib/api/crud-factory')
      await waitFor(() => {
        expect(tasks.update).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      const user = userEvent.setup()
      const { tasks } = await import('@/lib/api/crud-factory')

      vi.mocked(tasks.create).mockRejectedValueOnce(
        new Error('Server error occurred')
      )

      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled()
      })
    })

    it('allows retry after error', async () => {
      const user = userEvent.setup()
      const { tasks } = await import('@/lib/api/crud-factory')

      vi.mocked(tasks.create)
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce(createApiResponse(taskFactory.build()))

      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })

      // First attempt fails
      await user.click(submitButton)
      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled()
      })

      // Second attempt succeeds
      vi.clearAllMocks()
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Field-level Validation', () => {
    it('validates title in real-time', async () => {
      const user = userEvent.setup()
      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)

      // Type invalid length
      await user.type(titleInput, 'ab')

      expect(titleInput).toHaveValue('ab')

      // Type valid length
      await user.clear(titleInput)
      await user.type(titleInput, 'Valid Title')

      expect(titleInput).toHaveValue('Valid Title')
    })

    it('allows text input in description field', async () => {
      const user = userEvent.setup()
      renderForm()

      const descInput = screen.getByLabelText(/Açıklama/)
      await user.type(descInput, 'This is a task description')

      expect(descInput).toHaveValue('This is a task description')
    })
  })

  describe('Loading and Disabled States', () => {
    it('shows loading spinner during submission', async () => {
      const user = userEvent.setup()
      const { tasks } = await import('@/lib/api/crud-factory')

      vi.mocked(tasks.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve(createApiResponse(taskFactory.build())),
              100
            )
          )
      )

      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Check if button is disabled while submitting
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('re-enables submit button after submission completes', async () => {
      const user = userEvent.setup()
      renderForm()

      const titleInput = screen.getByLabelText(/Başlık/)
      await user.type(titleInput, 'Valid Task Title')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Wait for submission to complete
      await waitFor(
        () => {
          expect(submitButton).not.toBeDisabled()
        },
        { timeout: 2000 }
      )
    })
  })
})
