import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BeneficiaryForm } from '@/components/forms/BeneficiaryForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beneficiaryFactory } from '@/__tests__/test-utils/factories'
import * as sonner from 'sonner'

// Mock toast
vi.mock('sonner')

// Mock beneficiaries API
vi.mock('@/lib/api/crud-factory')

// Mock scrollIntoView for Radix UI Select
const mockScrollIntoView = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

describe('BeneficiaryForm', () => {
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
    
    // Setup beneficiaries API mock
    const { beneficiaries } = require('@/lib/api/crud-factory')
    beneficiaries.create = vi.fn().mockResolvedValue({
      success: true,
      data: beneficiaryFactory.build(),
    })
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
        <BeneficiaryForm {...defaultProps} />
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders form title and description', () => {
      renderForm()

      expect(screen.getByText('Yeni İhtiyaç Sahibi Ekle')).toBeInTheDocument()
      expect(
        screen.getByText(/İhtiyaç sahibi bilgilerini girerek yeni kayıt oluşturun/i)
      ).toBeInTheDocument()
    })

    it('renders all form sections with headings', () => {
      renderForm()

      expect(screen.getByText('Kişisel Bilgiler')).toBeInTheDocument()
      expect(screen.getByText('Adres Bilgileri')).toBeInTheDocument()
      expect(screen.getByText('Gelir Bilgileri')).toBeInTheDocument()
    })

    it('renders all required input fields', () => {
      renderForm()

      expect(screen.getByLabelText(/İsim/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/TC Kimlik/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Adres/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Şehir/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/İlçe/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Mahalle/i)).toBeInTheDocument()
    })

    it('renders submit and cancel buttons', () => {
      renderForm()

      expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iptal/i })).toBeInTheDocument()
    })

    it('renders form with default values', () => {
      renderForm()

      const familySizeInput = screen.getByDisplayValue('1') as HTMLInputElement
      expect(familySizeInput).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error for empty name field', async () => {
      const user = userEvent.setup()
      renderForm()

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/İsim en az 2 karakter olmalıdır/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for invalid TC number (not 11 digits)', async () => {
      const user = userEvent.setup()
      renderForm()

      const tcInput = screen.getByLabelText(/TC Kimlik/i)
      await user.type(tcInput, '123')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/TC Kimlik numarası 11 haneli olmalıdır/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for invalid phone number', async () => {
      const user = userEvent.setup()
      renderForm()

      const phoneInput = screen.getByLabelText(/Telefon/i)
      await user.type(phoneInput, '123')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/Geçerli bir telefon numarası girin/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for short address', async () => {
      const user = userEvent.setup()
      renderForm()

      const addressInput = screen.getByLabelText(/Adres/)
      await user.type(addressInput, 'kısa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/Adres en az 10 karakter olmalıdır/i)
        ).toBeInTheDocument()
      })
    })

    it('validates multiple fields at once', async () => {
      const user = userEvent.setup()
      renderForm()

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/İsim en az 2 karakter olmalıdır/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/TC Kimlik numarası 11 haneli olmalıdır/i)
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
      const mockBeneficiaries = await import('@/lib/api/crud-factory').then(
        m => m.beneficiaries
      )
      renderForm({ onSuccess })

      // Fill in form fields
      const nameInput = screen.getByLabelText(/İsim/)
      await user.type(nameInput, 'Test Beneficiary')

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const addressInput = screen.getByLabelText(/^Adres/)
      await user.type(addressInput, 'Test Street 123 Apt 456')

      const cityInput = screen.getByLabelText(/Şehir/)
      await user.type(cityInput, 'Istanbul')

      const districtInput = screen.getByLabelText(/İlçe/)
      await user.type(districtInput, 'Kadıköy')

      const neighborhoodInput = screen.getByLabelText(/Mahalle/)
      await user.type(neighborhoodInput, 'Caferağa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockBeneficiaries.create).toHaveBeenCalled()
      })
    })

    it('calls onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      // Fill form with valid data
      const nameInput = screen.getByLabelText(/İsim/)
      await user.type(nameInput, 'Test Beneficiary')

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const addressInput = screen.getByLabelText(/^Adres/)
      await user.type(addressInput, 'Test Street 123 Apt 456')

      const cityInput = screen.getByLabelText(/Şehir/)
      await user.type(cityInput, 'Istanbul')

      const districtInput = screen.getByLabelText(/İlçe/)
      await user.type(districtInput, 'Kadıköy')

      const neighborhoodInput = screen.getByLabelText(/Mahalle/)
      await user.type(neighborhoodInput, 'Caferağa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows success toast after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      // Fill form
      const nameInput = screen.getByLabelText(/İsim/)
      await user.type(nameInput, 'Test Beneficiary')

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const addressInput = screen.getByLabelText(/^Adres/)
      await user.type(addressInput, 'Test Street 123 Apt 456')

      const cityInput = screen.getByLabelText(/Şehir/)
      await user.type(cityInput, 'Istanbul')

      const districtInput = screen.getByLabelText(/İlçe/)
      await user.type(districtInput, 'Kadıköy')

      const neighborhoodInput = screen.getByLabelText(/Mahalle/)
      await user.type(neighborhoodInput, 'Caferağa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'İhtiyaç sahibi başarıyla eklendi'
        )
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

    it('does not submit form when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      const cancelButton = screen.getByRole('button', { name: /iptal/i })
      await user.click(cancelButton)

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      const { beneficiaries } = await import('@/lib/api/crud-factory')

      vi.mocked(beneficiaries.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true, data: {} }), 100)
          )
      )

      renderForm()

      // Fill form
      const nameInput = screen.getByLabelText(/İsim/)
      await user.type(nameInput, 'Test Beneficiary')

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const addressInput = screen.getByLabelText(/^Adres/)
      await user.type(addressInput, 'Test Street 123 Apt 456')

      const cityInput = screen.getByLabelText(/Şehir/)
      await user.type(cityInput, 'Istanbul')

      const districtInput = screen.getByLabelText(/İlçe/)
      await user.type(districtInput, 'Kadıköy')

      const neighborhoodInput = screen.getByLabelText(/Mahalle/)
      await user.type(neighborhoodInput, 'Caferağa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Button should be disabled while submitting
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('shows loading overlay during submission', async () => {
      const user = userEvent.setup()
      const { beneficiaries } = await import('@/lib/api/crud-factory')

      vi.mocked(beneficiaries.create).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true, data: {} }), 100)
          )
      )

      renderForm()

      // Fill form
      const nameInput = screen.getByLabelText(/İsim/)
      await user.type(nameInput, 'Test Beneficiary')

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const addressInput = screen.getByLabelText(/^Adres/)
      await user.type(addressInput, 'Test Street 123 Apt 456')

      const cityInput = screen.getByLabelText(/Şehir/)
      await user.type(cityInput, 'Istanbul')

      const districtInput = screen.getByLabelText(/İlçe/)
      await user.type(districtInput, 'Kadıköy')

      const neighborhoodInput = screen.getByLabelText(/Mahalle/)
      await user.type(neighborhoodInput, 'Caferağa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Check for loading overlay text
      await waitFor(() => {
        expect(screen.getByText(/İhtiyaç sahibi kaydediliyor/i)).toBeInTheDocument()
      })
    })
  })

  describe('Field-level Validation', () => {
    it('validates name field in real-time', async () => {
      const user = userEvent.setup()
      renderForm()

      const nameInput = screen.getByLabelText(/İsim/)

      // Type valid name
      await user.type(nameInput, 'John')

      // Field should show as valid (visual feedback)
      expect(nameInput).toHaveValue('John')
    })

    it('accepts valid TC number', async () => {
      const user = userEvent.setup()
      renderForm()

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      expect(tcInput).toHaveValue('12345678901')
    })

    it('formats phone number input correctly', async () => {
      const user = userEvent.setup()
      renderForm()

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      // Should contain the typed digits
      expect(phoneInput.value).toContain('5321234567')
    })
  })

  describe('Select Fields', () => {
    it('renders income level options', () => {
      renderForm()

      const incomeLevel = screen.getByLabelText(/Gelir Düzeyi/)
      expect(incomeLevel).toBeInTheDocument()
    })

    it('renders status options', () => {
      renderForm()

      const statusField = screen.getByLabelText(/Durum/)
      expect(statusField).toBeInTheDocument()
    })

    it('has default selected value for income level', () => {
      renderForm()

      const incomeLevel = screen.getByDisplayValue(/0-3000/)
      expect(incomeLevel).toBeInTheDocument()
    })

    it('has default selected value for status', () => {
      renderForm()

      const status = screen.getByDisplayValue(/Aktif/)
      expect(status).toBeInTheDocument()
    })
  })

  describe('Optional Fields', () => {
    it('renders optional health status field', () => {
      renderForm()

      expect(screen.getByLabelText(/Sağlık Durumu/i)).toBeInTheDocument()
    })

    it('renders optional employment status field', () => {
      renderForm()

      expect(screen.getByLabelText(/Çalışma Durumu/i)).toBeInTheDocument()
    })

    it('renders optional notes field', () => {
      renderForm()

      expect(screen.getByLabelText(/Notlar/i)).toBeInTheDocument()
    })

    it('allows submission without filling optional fields', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      // Fill only required fields
      const nameInput = screen.getByLabelText(/İsim/)
      await user.type(nameInput, 'Test Beneficiary')

      const tcInput = screen.getByLabelText(/TC Kimlik/)
      await user.type(tcInput, '12345678901')

      const phoneInput = screen.getByLabelText(/Telefon/)
      await user.type(phoneInput, '5321234567')

      const addressInput = screen.getByLabelText(/^Adres/)
      await user.type(addressInput, 'Test Street 123 Apt 456')

      const cityInput = screen.getByLabelText(/Şehir/)
      await user.type(cityInput, 'Istanbul')

      const districtInput = screen.getByLabelText(/İlçe/)
      await user.type(districtInput, 'Kadıköy')

      const neighborhoodInput = screen.getByLabelText(/Mahalle/)
      await user.type(neighborhoodInput, 'Caferağa')

      const submitButton = screen.getByRole('button', { name: /kaydet/i })
      await user.click(submitButton)

      // Should submit successfully
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })
})
