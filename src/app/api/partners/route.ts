import { NextRequest } from 'next/server';
import { appwritePartners, normalizeQueryParams } from '@/lib/appwrite/api';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';

// TypeScript interfaces
interface PartnerFilters {
  type?: string;
  status?: string;
  partnership_type?: string;
}

interface PartnerData {
  name?: string;
  type?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  partnership_type?: string;
  collaboration_start_date?: string;
  collaboration_end_date?: string;
  notes?: string;
  status?: string;
  total_contribution?: number;
  contribution_count?: number;
  logo_url?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate partner data
 */
function validatePartnerData(data: PartnerData): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Partner adı en az 2 karakter olmalıdır');
  }

  if (!data.type || !['organization', 'individual', 'sponsor'].includes(data.type)) {
    errors.push('Geçersiz partner türü');
  }

  if (
    !data.partnership_type ||
    !['donor', 'supplier', 'volunteer', 'sponsor', 'service_provider'].includes(
      data.partnership_type
    )
  ) {
    errors.push('Geçersiz işbirliği türü');
  }

  // Email validation (optional but if provided must be valid)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Geçerli bir email adresi giriniz');
  }

  // Phone validation (optional but if provided must be valid)
  if (data.phone && !/^[0-9\s\-\+\(\)]{10,15}$/.test(data.phone)) {
    errors.push('Geçerli bir telefon numarası giriniz');
  }

  // Status validation
  if (data.status && !['active', 'inactive', 'pending'].includes(data.status)) {
    errors.push('Geçersiz durum değeri');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * GET /api/partners
 * List partners with pagination and filters
 */
export const GET = buildApiRoute({
  requireModule: 'partners',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);

  // Extract filters from query params
  const filters: PartnerFilters = {};
  if (searchParams.get('type')) filters.type = searchParams.get('type') || undefined;
  if (searchParams.get('status')) filters.status = searchParams.get('status') || undefined;
  if (searchParams.get('partnership_type'))
    filters.partnership_type = searchParams.get('partnership_type') || undefined;

    const response = await appwritePartners.list({
      limit: params.limit,
      skip: params.skip,
      search: params.search,
      type: filters?.type,
      status: filters?.status,
      partnership_type: filters?.partnership_type,
    });

  const partners = response.documents || [];
  const total = response.total || 0;

  return successResponse(partners, `${total} partner bulundu`);
});

/**
 * POST /api/partners
 * Create new partner
 */
export const POST = buildApiRoute({
  requireModule: 'partners',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 50, windowMs: 60000 },
  supportOfflineSync: true,
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  await requireAuthenticatedUser();

  const { data: body, error: parseError } = await parseBody<PartnerData>(request);
  if (parseError || !body) {
    return errorResponse(parseError || 'Veri bulunamadı', 400);
  }

  // Validate partner data
  const validation = validatePartnerData(body);
  if (!validation.isValid) {
    return errorResponse('Doğrulama hatası', 400, validation.errors);
  }

  // Prepare Appwrite mutation data
  const partnerData = {
    name: body.name || '',
    type: body.type as 'organization' | 'individual' | 'sponsor',
    contact_person: body.contact_person,
    email: body.email,
    phone: body.phone,
    address: body.address,
    website: body.website,
    tax_number: body.tax_number,
    partnership_type: body.partnership_type as
      | 'donor'
      | 'supplier'
      | 'volunteer'
      | 'sponsor'
      | 'service_provider',
    collaboration_start_date: body.collaboration_start_date,
    collaboration_end_date: body.collaboration_end_date,
    notes: body.notes,
    status: (body.status as 'active' | 'inactive' | 'pending') || 'active',
    total_contribution: body.total_contribution || 0,
    contribution_count: body.contribution_count || 0,
    logo_url: body.logo_url,
  };

  const response = await appwritePartners.create(partnerData);

  return successResponse(response, 'Partner başarıyla oluşturuldu', 201);
});
