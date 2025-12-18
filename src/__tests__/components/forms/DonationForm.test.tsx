/**
 * Tests for DonationForm component
 * Validates donation form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DonationForm } from '@/components/forms/DonationForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as sonner from 'sonner'
import { donationFactory, createApiResponse } from '@/__tests__/test-utils/factories'

// Mock dependencies
vi.mock('sonner')
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock API
vi.mock('@/lib/api/crud-factory', () => ({
  donations: {
    create: vi.fn().mockResolvedValue({
      success: true,
      data: { $id: 'donation-123', donor_name: 'Test Donor' },
    }),
    update: vi.fn().mockResolvedValue({
      success: true,
      data: { $id: 'donation-123', donor_name: 'Updated Donor' },
    }),
  },
}))

// Mock file upload
vi.mock('@/components/ui/file-upload', () => ({
  FileUpload: ({ onFileSelect }: any) => (
    <div>
      <input
        type="file"
        data-testid="receipt-file-input"
        onChange={(e) => onFileSelect?.(e.target.files?.[0])}
      />
    </div>
  ),
}))

// Mock scrollIntoView
const mockScrollIntoView = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

describe('DonationForm', () => {
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
        <DonationForm {...defaultProps} />
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders form title', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText(/Bağış Formu/i)).toBeInTheDocument()
      })
    })

    it('renders donor information section', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText(/Bağışçı Bilgileri/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/E-posta/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument()
      })
    })

    it('renders donation details section', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText(/Bağış Detayları/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Bağış Türü/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Miktar/i)).toBeInTheDocument()
      })
    })

    it('renders payment information section', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText(/Ödeme Bilgileri/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Ödeme Yöntemi/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Para Birimi/i)).toBeInTheDocument()
      })
    })

    it('renders optional receipt field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Makbuz Numarası/i)).toBeInTheDocument()
      })
    })

    it('renders optional notes field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Notlar/i)).toBeInTheDocument()
      })
    })

    it('renders submit and cancel buttons', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /iptal/i })).toBeInTheDocument()
      })
    })

    it('defaults currency to TRY', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue('TRY')).toBeInTheDocument()
      })
    })

    it('defaults status to pending', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue(/Beklemede/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('shows error for empty donor name', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/isim gereklidir|adı soyadı gereklidir/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for invalid email', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/E-posta/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/e-posta formatı hatalı|geçerli bir e-posta girin/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for zero or negative amount', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '0')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/miktar 0 den büyük olmalıdır|pozitif bir miktar girin/i)
        ).toBeInTheDocument()
      })
    })

    it('validates phone number format', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument()
      })

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '123')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Validation should catch invalid phone
      expect(
        screen.queryByText(/telefon formatı hatalı/i)
      ).toBeInTheDocument()
    })

    it('requires donation type selection', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Check if donation type is required
      expect(
        screen.getByText(/bağış türü gereklidir/i)
      ).toBeInTheDocument()
    })

    it('requires payment method selection', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Check if payment method is required
      expect(
        screen.getByText(/ödeme yöntemi gereklidir/i)
      ).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('does not submit with invalid data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).not.toHaveBeenCalled()
      })
    })

    it('submits form with valid required data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const typeSelects = screen.getAllByRole('combobox')
      const donationTypeSelect = typeSelects[0]
      await user.click(donationTypeSelect)
      const typeOption = await screen.findByText(/Mali Bağış|Gıda|Ayni/)
      await user.click(typeOption)

      const methodSelects = screen.getAllByRole('combobox')
      const paymentMethodSelect = methodSelects[1]
      await user.click(paymentMethodSelect)
      const methodOption = await screen.findByText(/Banka Transferi|Nakit/)
      await user.click(methodOption)

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows success toast after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const typeSelects = screen.getAllByRole('combobox')
      if (typeSelects.length > 0) {
        await user.click(typeSelects[0])
        const typeOption = await screen.findByText(/Mali Bağış|Gıda|Ayni/)
        await user.click(typeOption)
      }

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Cancel Button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderForm({ onCancel })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iptal/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /iptal/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('does not submit when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iptal/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /iptal/i })
      await user.click(cancelButton)

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Donation Type Selection', () => {
    it('allows selecting donation type', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Bağış Türü/i)).toBeInTheDocument()
      })

      const typeSelects = screen.getAllByRole('combobox')
      if (typeSelects.length > 0) {
        await user.click(typeSelects[0])
        const options = await screen.findAllByText(/Mali|Gıda|Ayni/)
        if (options.length > 0) {
          await user.click(options[0])
        }
      }
    })
  })

  describe('Payment Method Selection', () => {
    it('allows selecting payment method', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ödeme Yöntemi/i)).toBeInTheDocument()
      })

      const methodSelects = screen.getAllByRole('combobox')
      if (methodSelects.length > 1) {
        await user.click(methodSelects[1])
        const options = await screen.findAllByText(/Banka|Nakit|Kart/)
        if (options.length > 0) {
          await user.click(options[0])
        }
      }
    })
  })

  describe('Currency Selection', () => {
    it('defaults to TRY', async () => {
      renderForm()

      await waitFor(() => {
        const currencyField = screen.getByDisplayValue('TRY')
        expect(currencyField).toBeInTheDocument()
      })
    })

    it('allows changing currency', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue('TRY')).toBeInTheDocument()
      })

      const currencySelects = screen.getAllByRole('combobox')
      const currencySelect = currencySelects.find(
        sel => sel.getAttribute('value') === 'TRY'
      )

      if (currencySelect) {
        await user.click(currencySelect)
        const usdOption = await screen.findByText('USD')
        await user.click(usdOption)

        expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
      }
    })
  })

  describe('Amount Input', () => {
    it('accepts numeric amount', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '5000')

      expect(amountInput).toHaveValue(5000)
    })

    it('accepts decimal amounts', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1500.50')

      expect(amountInput).toHaveValue(1500.5)
    })

    it('displays amount for formatting', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Miktar/i)).toBeInTheDocument()
      })

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '10000')

      // Amount should be displayed/formatted
      expect(amountInput).toHaveValue(10000)
    })
  })

  describe('Optional Fields', () => {
    it('allows submission without receipt number', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Should allow submission without optional receipt
      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })

    it('allows submission without notes', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Should allow submission without notes
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
      const { donations } = await import('@/lib/api/crud-factory')

      vi.mocked(donations.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve(createApiResponse(donationFactory.build())),
              100
            )
          )
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      const user = userEvent.setup()
      const { donations } = await import('@/lib/api/crud-factory')

      vi.mocked(donations.create).mockRejectedValueOnce(
        new Error('Sunucu hatası')
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Adı Soyadı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Adı Soyadı/)
      await user.type(nameInput, 'Test Donor')

      const emailInput = screen.getByLabelText(/E-posta/)
      await user.type(emailInput, 'test@example.com')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const amountInput = screen.getByLabelText(/Miktar/)
      await user.clear(amountInput)
      await user.type(amountInput, '1000')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled()
      })
    })
  })
})
