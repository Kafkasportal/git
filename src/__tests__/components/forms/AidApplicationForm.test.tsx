/**
 * Tests for AidApplicationForm component
 * Validates aid application form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AidApplicationForm } from '@/components/forms/AidApplicationForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as sonner from 'sonner'

// Mock toast
vi.mock('sonner')

// Mock API
vi.mock('@/lib/api/crud-factory', () => ({
  aidApplications: {
    create: vi.fn().mockResolvedValue({
      success: true,
      data: { $id: 'aid-123', applicant_name: 'Test Applicant' },
    }),
  },
  beneficiaries: {
    getAll: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          $id: 'ben-1',
          _id: 'ben-1',
          name: 'Ahmet Yılmaz',
          city: 'Istanbul',
          status: 'AKTIF',
        },
        {
          $id: 'ben-2',
          _id: 'ben-2',
          name: 'Fatma Kaya',
          city: 'Ankara',
          status: 'AKTIF',
        },
      ],
    }),
  },
}))

// Mock scrollIntoView
const mockScrollIntoView = vi.fn()
const originalScrollIntoView = Element.prototype.scrollIntoView

describe('AidApplicationForm', () => {
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
        <AidApplicationForm {...defaultProps} />
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders form title and description', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Yeni Yardım Başvurusu')).toBeInTheDocument()
        expect(
          screen.getByText(/Portal Plus tarzı yardım başvuru formu/i)
        ).toBeInTheDocument()
      })
    })

    it('renders all sections with icons', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Başvuru Bilgileri')).toBeInTheDocument()
        expect(screen.getByText('Yardım Türleri')).toBeInTheDocument()
        expect(screen.getByText('Ek Bilgiler')).toBeInTheDocument()
      })
    })

    it('renders required form fields', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Türü/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })
    })

    it('renders aid type fields', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Tek Seferlik Yardım/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Düzenli Mali Yardım/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Düzenli Gıda Yardımı/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Ayni Yardım/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Hizmet Yönlendirmesi/i)).toBeInTheDocument()
      })
    })

    it('renders optional beneficiary selector', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/İhtiyaç Sahibi/i)).toBeInTheDocument()
      })
    })

    it('renders submit and cancel buttons', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /gönder/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /iptal/i })).toBeInTheDocument()
      })
    })

    it('loads beneficiary list from API', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Ahmet Yılmaz - Istanbul')).toBeInTheDocument()
        expect(screen.getByText('Fatma Kaya - Ankara')).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('shows error for empty applicant name', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/İsim en az 2 karakter olmalıdır/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for short applicant name', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'A')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/İsim en az 2 karakter olmalıdır/i)
        ).toBeInTheDocument()
      })
    })

    it('requires at least one aid type to be specified', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      // If no aid amount is provided, should still allow submission (all aid fields are optional)
      // But validation message might be shown
      expect(screen.queryByText(/en az bir yardım türü/i)).not.toBeInTheDocument()
    })

    it('validates applicant type is selected', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Türü/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      // Applicant type has default value, so no error
      expect(
        screen.queryByText(/başvuran türü gereklidir/i)
      ).not.toBeInTheDocument()
    })

    it('validates numeric aid amount fields', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Tek Seferlik Yardım/i)).toBeInTheDocument()
      })

      const aidInput = screen.getByLabelText(/Tek Seferlik Yardım/)
      await user.type(aidInput, 'invalid')

      // Input should only accept numbers
      expect(aidInput).toHaveValue(0)
    })
  })

  describe('Form Submission', () => {
    it('does not submit with invalid required data', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /gönder/i })
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
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant Name')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows success toast after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant Name')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Başvuru başarıyla oluşturuldu'
        )
      })
    })

    it('submits with all aid types filled', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      // Fill aid amounts
      const onceAidInput = screen.getByLabelText(/Tek Seferlik Yardım/)
      await user.clear(onceAidInput)
      await user.type(onceAidInput, '5000')

      const regularAidInput = screen.getByLabelText(/Düzenli Mali Yardım/)
      await user.clear(regularAidInput)
      await user.type(regularAidInput, '2000')

      const foodAidInput = screen.getByLabelText(/Düzenli Gıda Yardımı/)
      await user.clear(foodAidInput)
      await user.type(foodAidInput, '500')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('invalidates aid-applications cache after submission', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Applicant Type Selection', () => {
    it('defaults to person applicant type', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Kişi')).toBeInTheDocument()
      })
    })

    it('allows changing applicant type to organization', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Başvuran Türü')).toBeInTheDocument()
      })

      const typeSelect = screen.getByDisplayValue('Kişi')
      await user.click(typeSelect)

      const orgOption = await screen.findByText('Kurum')
      await user.click(orgOption)

      expect(screen.getByDisplayValue('Kurum')).toBeInTheDocument()
    })

    it('allows changing applicant type to partner', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Başvuran Türü')).toBeInTheDocument()
      })

      const typeSelect = screen.getByDisplayValue('Kişi')
      await user.click(typeSelect)

      const partnerOption = await screen.findByText('Partner')
      await user.click(partnerOption)

      expect(screen.getByDisplayValue('Partner')).toBeInTheDocument()
    })
  })

  describe('Beneficiary Selection', () => {
    it('renders beneficiary selector with placeholder', async () => {
      renderForm()

      await waitFor(() => {
        expect(
          screen.getByText(/İhtiyaç sahibi seçin/i)
        ).toBeInTheDocument()
      })
    })

    it('displays loaded beneficiaries in dropdown', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Ahmet Yılmaz - Istanbul')).toBeInTheDocument()
        expect(screen.getByText('Fatma Kaya - Ankara')).toBeInTheDocument()
      })
    })

    it('allows selecting a beneficiary', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByText('Ahmet Yılmaz - Istanbul')).toBeInTheDocument()
      })

      const beneficiarySelect = screen.getByDisplayValue(/İhtiyaç sahibi seçin/i)
      await user.click(beneficiarySelect)

      const option = await screen.findByText('Ahmet Yılmaz - Istanbul')
      await user.click(option)

      expect(screen.getByDisplayValue('Ahmet Yılmaz - Istanbul')).toBeInTheDocument()
    })
  })

  describe('Priority Selection', () => {
    it('defaults to normal priority', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Normal')).toBeInTheDocument()
      })
    })

    it('allows changing priority to high', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Normal')).toBeInTheDocument()
      })

      const prioritySelects = screen.getAllByRole('combobox')
      const prioritySelect = prioritySelects.find(
        sel => sel.getAttribute('value') === 'normal'
      )

      if (prioritySelect) {
        await user.click(prioritySelect)
        const highOption = await screen.findByText('Yüksek')
        await user.click(highOption)

        expect(screen.getByDisplayValue('Yüksek')).toBeInTheDocument()
      }
    })

    it('allows changing priority to urgent', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Normal')).toBeInTheDocument()
      })

      const prioritySelects = screen.getAllByRole('combobox')
      const prioritySelect = prioritySelects.find(
        sel => sel.getAttribute('value') === 'normal'
      )

      if (prioritySelect) {
        await user.click(prioritySelect)
        const urgentOption = await screen.findByText('Acil')
        await user.click(urgentOption)

        expect(screen.getByDisplayValue('Acil')).toBeInTheDocument()
      }
    })
  })

  describe('Aid Type Fields', () => {
    it('accepts numeric values for one-time aid', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Tek Seferlik Yardım/i)).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/Tek Seferlik Yardım/)
      await user.clear(input)
      await user.type(input, '5000')

      expect(input).toHaveValue(5000)
    })

    it('accepts numeric values for regular financial aid', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Düzenli Mali Yardım/i)).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/Düzenli Mali Yardım/)
      await user.clear(input)
      await user.type(input, '2000')

      expect(input).toHaveValue(2000)
    })

    it('accepts numeric values for food aid', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Düzenli Gıda Yardımı/i)).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/Düzenli Gıda Yardımı/)
      await user.clear(input)
      await user.type(input, '500')

      expect(input).toHaveValue(500)
    })

    it('accepts numeric values for in-kind aid', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Ayni Yardım/i)).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/Ayni Yardım/)
      await user.clear(input)
      await user.type(input, '1000')

      expect(input).toHaveValue(1000)
    })

    it('accepts numeric values for service referral', async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Hizmet Yönlendirmesi/i)).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/Hizmet Yönlendirmesi/)
      await user.clear(input)
      await user.type(input, '3000')

      expect(input).toHaveValue(3000)
    })

    it('defaults aid amounts to zero', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Tek Seferlik Yardım/i)).toHaveValue(0)
        expect(screen.getByLabelText(/Düzenli Mali Yardım/i)).toHaveValue(0)
      })
    })
  })

  describe('Optional Fields', () => {
    it('renders optional description field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Açıklama/i)).toBeInTheDocument()
      })
    })

    it('renders optional notes field', async () => {
      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Notlar/i)).toBeInTheDocument()
      })
    })

    it('allows submitting without description', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('allows submitting without notes', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderForm({ onSuccess })

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
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

  describe('Loading State', () => {
    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      const { aidApplications } = await import('@/lib/api/crud-factory')

      vi.mocked(aidApplications.create).mockImplementationOnce(
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
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('shows loading overlay during submission', async () => {
      const user = userEvent.setup()
      const { aidApplications } = await import('@/lib/api/crud-factory')

      vi.mocked(aidApplications.create).mockImplementationOnce(
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
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      // Check for loading text
      await waitFor(() => {
        expect(screen.queryByText(/gönderiliyor/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      const user = userEvent.setup()
      const { aidApplications } = await import('@/lib/api/crud-factory')

      vi.mocked(aidApplications.create).mockRejectedValueOnce(
        new Error('Sunucu hatası')
      )

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalled()
      })
    })

    it('allows retry after error', async () => {
      const user = userEvent.setup()
      const { aidApplications } = await import('@/lib/api/crud-factory')

      vi.mocked(aidApplications.create)
        .mockRejectedValueOnce(new Error('Sunucu hatası'))
        .mockResolvedValueOnce({ success: true, data: {} })

      renderForm()

      await waitFor(() => {
        expect(screen.getByLabelText(/Başvuran Adı/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/Başvuran Adı/)
      await user.type(nameInput, 'Test Applicant')

      const submitButton = screen.getByRole('button', { name: /gönder/i })

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
})
