/**
 * Tests for InvoiceForm component
 * Validates invoice form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InvoiceForm from '@/components/forms/InvoiceForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as sonner from 'sonner'

// Mock dependencies
vi.mock('sonner')

const mockInvoice = {
  $id: 'invoice-123',
  invoice_number: 'INV-001',
  client_name: 'Test Client',
  items: [{ description: 'Test', quantity: 1, unit_price: 100, total: 100 }],
  subtotal: 100,
  total: 100,
  currency: 'TRY',
  issue_date: new Date().toISOString(),
  due_date: new Date().toISOString(),
  status: 'draft' as const,
}

vi.mock('@/lib/api/crud-factory', () => ({
  invoices: {
    create: vi.fn().mockResolvedValue({
      data: { $id: 'invoice-123', invoice_number: 'INV-001' },
      error: null,
    }),
  },
}))

const mockScrollIntoView = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

describe('InvoiceForm', () => {
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
      onSubmit: vi.fn().mockResolvedValue(undefined),
      onCancel: vi.fn(),
      ...props,
    }

    return render(
      <QueryClientProvider client={queryClient}>
        <InvoiceForm {...defaultProps} />
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders invoice form title', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText(/Fatura|İnvois/i)).toBeInTheDocument()
      })
    })

    it('renders invoice number field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası|İnvois Numarası/i)).toBeInTheDocument()
      })
    })

    it('renders invoice date field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Tarihi|İnvois Tarihi/i)).toBeInTheDocument()
      })
    })

    it('renders due date field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Vade|Ödeme Tarihi/i)).toBeInTheDocument()
      })
    })

    it('renders amount field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar|Tutar/i)).toBeInTheDocument()
      })
    })

    it('renders description field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Açıklama|Detay/i)).toBeInTheDocument()
      })
    })

    it('renders submit button', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /kaydet|gönder/i })).toBeInTheDocument()
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
    it('validates invoice number is required', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/fatura numarası|gereklidir/i)
        ).toBeInTheDocument()
      })
    })

    it('validates amount is required', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar|Tutar/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/miktar|tutar|gerekli/i)
        ).toBeInTheDocument()
      })
    })

    it('validates amount is positive', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar|Tutar/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.type(amountInput, '0')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/pozitif|sıfırdan büyük/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits with valid data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası/i)).toBeInTheDocument()
      })

      const invoiceNumberInput = screen.getByLabelText(/Fatura Numarası/)
      await user.type(invoiceNumberInput, 'INV-001')

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows success message after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası/i)).toBeInTheDocument()
      })

      const invoiceNumberInput = screen.getByLabelText(/Fatura Numarası/)
      await user.type(invoiceNumberInput, 'INV-001')

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
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

  describe('Date Fields', () => {
    it('accepts invoice date', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Tarihi/i)).toBeInTheDocument()
      })

      const dateInput = screen.getByLabelText(/Fatura Tarihi/)
      await user.type(dateInput, '12/01/2025')

      expect(dateInput).toHaveValue('12/01/2025')
    })

    it('accepts due date', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Vade|Ödeme Tarihi/i)).toBeInTheDocument()
      })

      const dueInput = screen.getByLabelText(/Vade|Ödeme Tarihi/)
      await user.type(dueInput, '12/31/2025')

      expect(dueInput).toHaveValue('12/31/2025')
    })
  })

  describe('Amount Input', () => {
    it('accepts numeric amounts', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar|Tutar/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.clear(amountInput)
      await user.type(amountInput, '10000.50')

      expect(amountInput).toHaveValue(10000.5)
    })
  })

  describe('Description Field', () => {
    it('accepts invoice description', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Açıklama|Detay/i)).toBeInTheDocument()
      })

      const descInput = screen.getByLabelText(/Açıklama|Detay/)
      await user.type(descInput, 'Invoice description')

      expect(descInput).toHaveValue('Invoice description')
    })

    it('allows submission without description (optional)', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası/i)).toBeInTheDocument()
      })

      const invoiceNumberInput = screen.getByLabelText(/Fatura Numarası/)
      await user.type(invoiceNumberInput, 'INV-001')

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
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
      const { invoices } = await import('@/lib/api/crud-factory')

      vi.mocked(invoices.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ data: mockInvoice, error: null }),
              100
            )
          )
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası/i)).toBeInTheDocument()
      })

      const invoiceNumberInput = screen.getByLabelText(/Fatura Numarası/)
      await user.type(invoiceNumberInput, 'INV-001')

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      const user = userEvent.setup()
      const { invoices } = await import('@/lib/api/crud-factory')

      vi.mocked(invoices.create).mockRejectedValueOnce(
        new Error('Fatura oluşturulamadı')
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Fatura Numarası/i)).toBeInTheDocument()
      })

      const invoiceNumberInput = screen.getByLabelText(/Fatura Numarası/)
      await user.type(invoiceNumberInput, 'INV-001')

      const amountInput = screen.getByLabelText(/Miktar|Tutar/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /kaydet|gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled()
      })
    })
  })
})
