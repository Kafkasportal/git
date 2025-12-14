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
import {
  beneficiaryApiCreateSchema,
  validateWithSchema,
} from "@/lib/validations/api-schemas";

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

  // Validate beneficiary data using centralized schema
  const validation = validateWithSchema(beneficiaryApiCreateSchema, body);
  if (!validation.isValid) {
    return errorResponse("Doğrulama hatası", 400, validation.errors);
  }

  // Use validated data (with defaults applied from schema)
  const validatedData = validation.data!;

  // Prepare Appwrite mutation data
  const beneficiaryData = {
    name: validatedData.name,
    tc_no: validatedData.tc_no,
    phone: validatedData.phone,
    address: validatedData.address,
    city: validatedData.city || "",
    district: validatedData.district || "",
    neighborhood: validatedData.neighborhood || "",
    family_size: validatedData.family_size || 1,
    status: validatedData.status || "TASLAK",
    email: validatedData.email || undefined,
    birth_date: validatedData.birth_date,
    gender: validatedData.gender,
    nationality: validatedData.nationality,
    religion: validatedData.religion,
    marital_status: validatedData.marital_status,
    children_count: validatedData.children_count,
    orphan_children_count: validatedData.orphan_children_count,
    elderly_count: validatedData.elderly_count,
    disabled_count: validatedData.disabled_count,
    income_level: validatedData.income_level,
    income_source: validatedData.income_source,
    has_debt: validatedData.has_debt,
    housing_type: validatedData.housing_type,
    has_vehicle: validatedData.has_vehicle,
    health_status: validatedData.health_status,
    has_chronic_illness: validatedData.has_chronic_illness,
    chronic_illness_detail: validatedData.chronic_illness_detail,
    has_disability: validatedData.has_disability,
    disability_detail: validatedData.disability_detail,
    has_health_insurance: validatedData.has_health_insurance,
    regular_medication: validatedData.regular_medication,
    education_level: validatedData.education_level,
    occupation: validatedData.occupation,
    employment_status: validatedData.employment_status,
    aid_type: validatedData.aid_type,
    totalAidAmount: validatedData.totalAidAmount,
    aid_duration: validatedData.aid_duration,
    priority: validatedData.priority,
    reference_name: validatedData.reference_name,
    reference_phone: validatedData.reference_phone,
    reference_relation: validatedData.reference_relation,
    application_source: validatedData.application_source,
    notes: validatedData.notes,
    previous_aid: validatedData.previous_aid,
    other_organization_aid: validatedData.other_organization_aid,
    emergency: validatedData.emergency,
    contact_preference: validatedData.contact_preference,
    approval_status: validatedData.approval_status,
    approved_by: validatedData.approved_by,
    approved_at: validatedData.approved_at,
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
