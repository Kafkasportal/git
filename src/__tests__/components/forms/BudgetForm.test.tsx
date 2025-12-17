/**
 * Tests for BudgetForm component
 * Validates budget form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetForm } from '@/components/forms/BudgetForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as sonner from 'sonner'

// Mock dependencies
vi.mock('sonner')
vi.mock('@/lib/api/crud-factory', () => ({
  budgets: {
    create: vi.fn().mockResolvedValue({
      success: true,
      data: { $id: 'budget-123', category: 'Program' },
    }),
  },
}))

const mockScrollIntoView = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

describe('BudgetForm', () => {
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
        <BudgetForm {...defaultProps} />
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders budget form title', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText(/Bütçe|Budget/i)).toBeInTheDocument()
      })
    })

    it('renders category field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori|Category/i)).toBeInTheDocument()
      })
    })

    it('renders allocated amount field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayrılan|Allocated|Miktar/i)).toBeInTheDocument()
      })
    })

    it('renders spent amount field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Harcanan|Spent|Kullanılan/i)).toBeInTheDocument()
      })
    })

    it('renders currency field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Para Birimi|Currency/i)).toBeInTheDocument()
      })
    })

    it('renders period/frequency field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Dönem|Period|Sıklık/i)).toBeInTheDocument()
      })
    })

    it('renders notes field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Notlar|Notes|Açıklama/i)).toBeInTheDocument()
      })
    })

    it('renders submit button', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })).toBeInTheDocument()
      })
    })

    it('renders cancel button', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iptal|kapat/i })).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('validates category is required', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/kategori|gerekli/i)
        ).toBeInTheDocument()
      })
    })

    it('validates allocated amount is required', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayrılan|Allocated/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/ayrılan|miktar|gerekli/i)
        ).toBeInTheDocument()
      })
    })

    it('validates allocated amount is positive', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayrılan|Allocated/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '0')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/pozitif|sıfırdan büyük/i)
        ).toBeInTheDocument()
      })
    })

    it('validates spent amount cannot exceed allocated', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayrılan|Allocated/i)).toBeInTheDocument()
      })

      const allocatedInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(allocatedInput)
      await user.type(allocatedInput, '1000')

      const spentInput = screen.getByLabelText(/Harcanan|Spent/)
      if (spentInput) {
        await user.clear(spentInput)
        await user.type(spentInput, '2000')

        const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(
            screen.getByText(/aşmaz|geçemez|fazla/i)
          ).toBeInTheDocument()
        })
      }
    })
  })

  describe('Form Submission', () => {
    it('submits with valid data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Kategori/)
      await user.click(categorySelect)

      const categoryOption = await screen.findByText(/Program|İdari|Yardım/)
      await user.click(categoryOption)

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows success message after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Kategori/)
      await user.click(categorySelect)

      const categoryOption = await screen.findByText(/Program|İdari|Yardım/)
      await user.click(categoryOption)

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Cancel Button', () => {
    it('calls onCancel when clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderForm({ onCancel })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iptal|kapat/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /iptal|kapat/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('Category Selection', () => {
    it('allows selecting category', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Kategori/)
      await user.click(categorySelect)

      const option = await screen.findByText(/Program|İdari|Yardım/)
      await user.click(option)

      expect(screen.getByDisplayValue(/Program|İdari|Yardım/i)).toBeInTheDocument()
    })
  })

  describe('Currency Selection', () => {
    it('allows changing currency', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Para Birimi|Currency/i)).toBeInTheDocument()
      })

      const currencySelect = screen.getByLabelText(/Para Birimi|Currency/)
      await user.click(currencySelect)

      const usdOption = await screen.findByText(/USD/)
      if (usdOption) {
        await user.click(usdOption)
        expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
      }
    })
  })

  describe('Amount Fields', () => {
    it('accepts allocated amount', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayrılan|Allocated/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '10000')

      expect(amountInput).toHaveValue(10000)
    })

    it('accepts spent amount', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Harcanan|Spent/i)).toBeInTheDocument()
      })

      const spentInput = screen.getByLabelText(/Harcanan|Spent/)
      if (spentInput) {
        await user.clear(spentInput)
        await user.type(spentInput, '5000')

        expect(spentInput).toHaveValue(5000)
      }
    })

    it('accepts decimal amounts', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayrılan|Allocated/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000.50')

      expect(amountInput).toHaveValue(5000.5)
    })
  })

  describe('Notes Field', () => {
    it('accepts budget notes', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Notlar|Notes/i)).toBeInTheDocument()
      })

      const notesInput = screen.getByLabelText(/Notlar|Notes/)
      await user.type(notesInput, 'Budget notes')

      expect(notesInput).toHaveValue('Budget notes')
    })

    it('allows submission without notes (optional)', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Kategori/)
      await user.click(categorySelect)

      const categoryOption = await screen.findByText(/Program|İdari|Yardım/)
      await user.click(categoryOption)

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('Loading State', () => {
    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      const { budgets } = await import('@/lib/api/crud-factory')

      vi.mocked(budgets.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ success: true, data: {} }),
              100
            )
          )
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Kategori/)
      await user.click(categorySelect)

      const categoryOption = await screen.findByText(/Program|İdari|Yardım/)
      await user.click(categoryOption)

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      const user = userEvent.setup()
      const { budgets } = await import('@/lib/api/crud-factory')

      vi.mocked(budgets.create).mockRejectedValueOnce(
        new Error('Bütçe oluşturulamadı')
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Kategori/i)).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Kategori/)
      await user.click(categorySelect)

      const categoryOption = await screen.findByText(/Program|İdari|Yardım/)
      await user.click(categoryOption)

      const amountInput = screen.getByLabelText(/Ayrılan|Allocated/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder|oluştur/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled()
      })
    })
  })
})
