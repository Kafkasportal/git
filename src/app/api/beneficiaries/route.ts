import { NextRequest } from "next/server";
import {
  appwriteBeneficiaries,
  normalizeQueryParams,
} from "@/lib/appwrite/api";
import { buildApiRoute } from "@/lib/api/middleware";
import {
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/route-helpers";
import {
  verifyCsrfToken,
  requireAuthenticatedUser,
} from "@/lib/api/auth-utils";

// TypeScript interfaces

interface BeneficiaryData {
  name?: string;
  tc_no?: string;
  phone?: string;
  address?: string;
  email?: string;
  status?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  family_size?: number;
  [key: string]: unknown;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate beneficiary data
 * NOTE: This function duplicates validation logic from beneficiarySchema in @/lib/validations/beneficiary
 * Consider refactoring to use Zod schema validation instead
 */
function validateBeneficiaryData(data: BeneficiaryData): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || data.name.trim().length < 2) {
    errors.push("Ad Soyad en az 2 karakter olmalıdır");
  }

  if (!data.tc_no || !/^\d{11}$/.test(data.tc_no)) {
    errors.push("TC Kimlik No 11 haneli olmalıdır");
  }

  if (!data.phone || !/^[0-9\s\-\+\(\)]{10,15}$/.test(data.phone)) {
    errors.push("Geçerli bir telefon numarası giriniz");
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.push("Adres en az 10 karakter olmalıdır");
  }

  // Email validation (optional but if provided must be valid)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Geçerli bir email adresi giriniz");
  }

  // Status validation
  if (
    data.status &&
    !["TASLAK", "AKTIF", "PASIF", "SILINDI"].includes(data.status)
  ) {
    errors.push("Geçersiz durum değeri");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * GET /api/beneficiaries
 * List beneficiaries with pagination and filters
 */
export const GET = buildApiRoute({
  requireModule: "beneficiaries",
  allowedMethods: ["GET"],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const params = normalizeQueryParams(searchParams);

  const response = await appwriteBeneficiaries.list({
    ...params,
    city: searchParams.get("city") || undefined,
  });

  const beneficiaries = response.documents || [];
  const total = response.total || 0;

  return successResponse(beneficiaries, `${total} kayıt bulundu`);
});

/**
 * POST /api/beneficiaries
 * Create new beneficiary
 */
export const POST = buildApiRoute({
  requireModule: "beneficiaries",
  allowedMethods: ["POST"],
  rateLimit: { maxRequests: 50, windowMs: 60000 },
  supportOfflineSync: true,
})(async (request: NextRequest) => {
  await verifyCsrfToken(request);
  const { user } = await requireAuthenticatedUser();

  const { data: body, error: parseError } =
    await parseBody<BeneficiaryData>(request);
  if (parseError || !body) {
    return errorResponse(parseError || "Veri bulunamadı", 400);
  }

  // Validate beneficiary data
  const validation = validateBeneficiaryData(body);
  if (!validation.isValid) {
    return errorResponse("Doğrulama hatası", 400, validation.errors);
  }

  // Prepare Appwrite mutation data
  const beneficiaryData = {
    name: body.name || "",
    tc_no: body.tc_no || "",
    phone: body.phone || "",
    address: body.address || "",
    city: body.city || "",
    district: body.district || "",
    neighborhood: body.neighborhood || "",
    family_size: body.family_size || 1,
    status:
      (body.status as "TASLAK" | "AKTIF" | "PASIF" | "SILINDI") ||
      ("TASLAK" as const),
    email: body.email as string | undefined,
    birth_date: body.birth_date as string | undefined,
    gender: body.gender as string | undefined,
    nationality: body.nationality as string | undefined,
    religion: body.religion as string | undefined,
    marital_status: body.marital_status as string | undefined,
    children_count: body.children_count as number | undefined,
    orphan_children_count: body.orphan_children_count as number | undefined,
    elderly_count: body.elderly_count as number | undefined,
    disabled_count: body.disabled_count as number | undefined,
    income_level: body.income_level as string | undefined,
    income_source: body.income_source as string | undefined,
    has_debt: body.has_debt as boolean | undefined,
    housing_type: body.housing_type as string | undefined,
    has_vehicle: body.has_vehicle as boolean | undefined,
    health_status: body.health_status as string | undefined,
    has_chronic_illness: body.has_chronic_illness as boolean | undefined,
    chronic_illness_detail: body.chronic_illness_detail as string | undefined,
    has_disability: body.has_disability as boolean | undefined,
    disability_detail: body.disability_detail as string | undefined,
    has_health_insurance: body.has_health_insurance as boolean | undefined,
    regular_medication: body.regular_medication as string | undefined,
    education_level: body.education_level as string | undefined,
    occupation: body.occupation as string | undefined,
    employment_status: body.employment_status as string | undefined,
    aid_type: body.aid_type as string | undefined,
    totalAidAmount: body.totalAidAmount as number | undefined,
    aid_duration: body.aid_duration as string | undefined,
    priority: body.priority as string | undefined,
    reference_name: body.reference_name as string | undefined,
    reference_phone: body.reference_phone as string | undefined,
    reference_relation: body.reference_relation as string | undefined,
    application_source: body.application_source as string | undefined,
    notes: body.notes as string | undefined,
    previous_aid: body.previous_aid as boolean | undefined,
    other_organization_aid: body.other_organization_aid as string | undefined,
    emergency: body.emergency as boolean | undefined,
    contact_preference: body.contact_preference as string | undefined,
    approval_status: body.approval_status as
      | "pending"
      | "approved"
      | "rejected"
      | undefined,
    approved_by: body.approved_by as string | undefined,
    approved_at: body.approved_at as string | undefined,
  };

  try {
    const response = await appwriteBeneficiaries.create(beneficiaryData, {
      auth: { userId: user.id, role: user.role ?? "Personel" },
    });

    return successResponse(
      response,
      "İhtiyaç sahibi başarıyla oluşturuldu",
      201,
    );
  } catch (error: unknown) {
    // Handle duplicate TC number
    const errorMessage = error instanceof Error ? error.message : "";
    if (
      errorMessage?.includes("already exists") ||
      errorMessage?.includes("duplicate")
    ) {
      return errorResponse("Bu TC Kimlik No zaten kayıtlı", 409);
    }
    throw error; // Let middleware handle other errors
  }
});
