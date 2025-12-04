import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, parseBody } from '@/lib/api/route-helpers';
import { verifyCsrfToken, requireAuthenticatedUser } from '@/lib/api/auth-utils';
import { z } from 'zod';
import type { RouteContext } from '@/lib/api/middleware';

/**
 * Aile üyesi ilişki türleri
 */
export enum FamilyRelation {
  /** Eş */
  SPOUSE = 'spouse',
  /** Çocuk */
  CHILD = 'child',
  /** Anne */
  MOTHER = 'mother',
  /** Baba */
  FATHER = 'father',
  /** Kardeş */
  SIBLING = 'sibling',
  /** Büyükanne */
  GRANDMOTHER = 'grandmother',
  /** Büyükbaba */
  GRANDFATHER = 'grandfather',
  /** Torun */
  GRANDCHILD = 'grandchild',
  /** Diğer akraba */
  OTHER_RELATIVE = 'other_relative',
  /** Bakmakla yükümlü diğer */
  DEPENDENT = 'dependent',
}

/**
 * Aile üyesi durumu
 */
export enum FamilyMemberStatus {
  /** Aktif - Birlikte yaşıyor */
  ACTIVE = 'active',
  /** Ayrı yaşıyor */
  SEPARATED = 'separated',
  /** Vefat etmiş */
  DECEASED = 'deceased',
  /** Kayıp */
  MISSING = 'missing',
}

/**
 * İlişki türü etiketleri (Türkçe)
 */
export const RELATION_LABELS: Record<FamilyRelation, string> = {
  [FamilyRelation.SPOUSE]: 'Eş',
  [FamilyRelation.CHILD]: 'Çocuk',
  [FamilyRelation.MOTHER]: 'Anne',
  [FamilyRelation.FATHER]: 'Baba',
  [FamilyRelation.SIBLING]: 'Kardeş',
  [FamilyRelation.GRANDMOTHER]: 'Büyükanne',
  [FamilyRelation.GRANDFATHER]: 'Büyükbaba',
  [FamilyRelation.GRANDCHILD]: 'Torun',
  [FamilyRelation.OTHER_RELATIVE]: 'Diğer Akraba',
  [FamilyRelation.DEPENDENT]: 'Bakmakla Yükümlü',
};

/**
 * Durum etiketleri (Türkçe)
 */
export const STATUS_LABELS: Record<FamilyMemberStatus, string> = {
  [FamilyMemberStatus.ACTIVE]: 'Aktif',
  [FamilyMemberStatus.SEPARATED]: 'Ayrı Yaşıyor',
  [FamilyMemberStatus.DECEASED]: 'Vefat',
  [FamilyMemberStatus.MISSING]: 'Kayıp',
};

/**
 * Aile üyesi şeması
 */
const familyMemberSchema = z.object({
  id: z.string().optional(),
  beneficiaryId: z.string().min(1, 'Yardım alıcı ID gerekli'),
  firstName: z.string().min(1, 'Ad gerekli'),
  lastName: z.string().min(1, 'Soyad gerekli'),
  relation: z.nativeEnum(FamilyRelation, { message: 'Geçersiz ilişki türü' }),
  tcKimlikNo: z.string().length(11, 'TC Kimlik No 11 haneli olmalı').optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  status: z.nativeEnum(FamilyMemberStatus).default(FamilyMemberStatus.ACTIVE),
  occupation: z.string().optional(),
  income: z.number().min(0).optional(),
  healthCondition: z.string().optional(),
  educationLevel: z.string().optional(),
  school: z.string().optional(),
  notes: z.string().optional(),
  isDependent: z.boolean().default(false),
  contactPhone: z.string().optional(),
});

type FamilyMember = z.infer<typeof familyMemberSchema>;

/**
 * Aile özeti şeması
 */
interface FamilySummary {
  totalMembers: number;
  dependents: number;
  children: number;
  workingMembers: number;
  totalFamilyIncome: number;
  averageAge: number;
  hasElderly: boolean;
  hasDisabled: boolean;
}

/**
 * Mock veri deposu (gerçek implementasyonda Appwrite kullanılır)
 */
const mockFamilyMembers: FamilyMember[] = [];

/**
 * GET /api/beneficiaries/[id]/family
 * Belirli bir yardım alıcının aile üyelerini getir
 */
export const GET = buildApiRoute({
  requireModule: 'yardim',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 100, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  try {
    await requireAuthenticatedUser();

    const params = context?.params ? await context.params : {};
    const beneficiaryId = params.id as string;

    if (!beneficiaryId) {
      return errorResponse('Yardım alıcı ID gerekli', 400);
    }

    const searchParams = request.nextUrl.searchParams;
    const includeDeceased = searchParams.get('includeDeceased') === 'true';
    const relation = searchParams.get('relation') as FamilyRelation | null;

    // Mock veri filtrele
    let members = mockFamilyMembers.filter(m => m.beneficiaryId === beneficiaryId);

    if (!includeDeceased) {
      members = members.filter(m => m.status !== FamilyMemberStatus.DECEASED);
    }

    if (relation) {
      members = members.filter(m => m.relation === relation);
    }

    // Örnek veri döndür (gerçekte Appwrite'dan çekilir)
    if (members.length === 0) {
      // Demo verisi oluştur
      members = generateMockFamilyData(beneficiaryId);
    }

    // Aile özeti hesapla
    const summary = calculateFamilySummary(members);

    // Aile ağacı yapısı oluştur
    const tree = buildFamilyTree(members);

    return successResponse({
      beneficiaryId,
      members,
      summary,
      tree,
      total: members.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Aile bilgileri alınamadı';
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/beneficiaries/[id]/family
 * Yeni aile üyesi ekle
 */
export const POST = buildApiRoute({
  requireModule: 'yardim',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 30, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();

    const params = context?.params ? await context.params : {};
    const beneficiaryId = params.id as string;

    if (!beneficiaryId) {
      return errorResponse('Yardım alıcı ID gerekli', 400);
    }

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return errorResponse(parseError, 400);
    }

    // Şema validasyonu
    const bodyObj = body as Record<string, unknown>;
    const validation = familyMemberSchema.safeParse({
      ...bodyObj,
      beneficiaryId,
    });

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((issue) => issue.message).join(', ');
      return errorResponse(errorMessages, 400);
    }

    const memberData = validation.data;

    // TC Kimlik No kontrolü
    if (memberData.tcKimlikNo) {
      const existing = mockFamilyMembers.find(
        m => m.tcKimlikNo === memberData.tcKimlikNo && m.beneficiaryId === beneficiaryId
      );
      if (existing) {
        return errorResponse('Bu TC Kimlik No ile kayıtlı aile üyesi zaten mevcut', 409);
      }
    }

    // Yeni üye oluştur
    const newMember: FamilyMember = {
      ...memberData,
      id: `fam_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };

    mockFamilyMembers.push(newMember);

    return successResponse({
      member: newMember,
      message: 'Aile üyesi başarıyla eklendi',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Aile üyesi eklenemedi';
    return errorResponse(message, 500);
  }
});

/**
 * PATCH /api/beneficiaries/[id]/family
 * Aile üyesi güncelle
 */
export const PATCH = buildApiRoute({
  requireModule: 'yardim',
  allowedMethods: ['PATCH'],
  rateLimit: { maxRequests: 30, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();

    const params = context?.params ? await context.params : {};
    const beneficiaryId = params.id as string;

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return errorResponse(parseError, 400);
    }

    const bodyObj = body as Record<string, unknown>;
    const { memberId, ...updates } = bodyObj;

    if (!memberId) {
      return errorResponse('Üye ID gerekli', 400);
    }

    // Üyeyi bul
    const memberIndex = mockFamilyMembers.findIndex(
      m => m.id === memberId && m.beneficiaryId === beneficiaryId
    );

    if (memberIndex === -1) {
      return errorResponse('Aile üyesi bulunamadı', 404);
    }

    // Güncelle
    mockFamilyMembers[memberIndex] = {
      ...mockFamilyMembers[memberIndex],
      ...updates,
    };

    return successResponse({
      member: mockFamilyMembers[memberIndex],
      message: 'Aile üyesi güncellendi',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Güncelleme başarısız';
    return errorResponse(message, 500);
  }
});

/**
 * DELETE /api/beneficiaries/[id]/family
 * Aile üyesi sil
 */
export const DELETE = buildApiRoute({
  requireModule: 'yardim',
  allowedMethods: ['DELETE'],
  rateLimit: { maxRequests: 20, windowMs: 60000 },
})(async (request: NextRequest, context?: RouteContext) => {
  try {
    await verifyCsrfToken(request);
    await requireAuthenticatedUser();

    const params = context?.params ? await context.params : {};
    const beneficiaryId = params.id as string;

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return errorResponse(parseError, 400);
    }

    const bodyObj = body as Record<string, unknown>;
    const memberId = bodyObj.memberId as string;
    const softDelete = bodyObj.softDelete !== false;

    if (!memberId) {
      return errorResponse('Üye ID gerekli', 400);
    }

    const memberIndex = mockFamilyMembers.findIndex(
      m => m.id === memberId && m.beneficiaryId === beneficiaryId
    );

    if (memberIndex === -1) {
      return errorResponse('Aile üyesi bulunamadı', 404);
    }

    if (softDelete) {
      // Soft delete - durumu değiştir
      mockFamilyMembers[memberIndex].status = FamilyMemberStatus.SEPARATED;
    } else {
      // Hard delete
      mockFamilyMembers.splice(memberIndex, 1);
    }

    return successResponse({
      message: 'Aile üyesi silindi',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Silme işlemi başarısız';
    return errorResponse(message, 500);
  }
});

/**
 * Demo aile verisi oluştur
 */
function generateMockFamilyData(beneficiaryId: string): FamilyMember[] {
  const members: FamilyMember[] = [
    {
      id: `fam_${beneficiaryId}_1`,
      beneficiaryId,
      firstName: 'Fatma',
      lastName: 'Yılmaz',
      relation: FamilyRelation.SPOUSE,
      gender: 'female',
      birthDate: '1985-03-15',
      status: FamilyMemberStatus.ACTIVE,
      occupation: 'Ev hanımı',
      income: 0,
      isDependent: true,
    },
    {
      id: `fam_${beneficiaryId}_2`,
      beneficiaryId,
      firstName: 'Emre',
      lastName: 'Yılmaz',
      relation: FamilyRelation.CHILD,
      gender: 'male',
      birthDate: '2010-08-20',
      status: FamilyMemberStatus.ACTIVE,
      educationLevel: 'İlkokul',
      school: 'Cumhuriyet İlkokulu',
      isDependent: true,
    },
    {
      id: `fam_${beneficiaryId}_3`,
      beneficiaryId,
      firstName: 'Zeynep',
      lastName: 'Yılmaz',
      relation: FamilyRelation.CHILD,
      gender: 'female',
      birthDate: '2015-12-10',
      status: FamilyMemberStatus.ACTIVE,
      educationLevel: 'Anaokulu',
      isDependent: true,
    },
    {
      id: `fam_${beneficiaryId}_4`,
      beneficiaryId,
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      relation: FamilyRelation.MOTHER,
      gender: 'female',
      birthDate: '1955-01-05',
      status: FamilyMemberStatus.ACTIVE,
      healthCondition: 'Diyabet, hipertansiyon',
      isDependent: true,
    },
  ];

  return members;
}

/**
 * Aile özeti hesapla
 */
function calculateFamilySummary(members: FamilyMember[]): FamilySummary {
  const activeMembers = members.filter(m => m.status === FamilyMemberStatus.ACTIVE);
  
  const currentYear = new Date().getFullYear();
  const ages = activeMembers
    .filter(m => m.birthDate)
    .map(m => currentYear - new Date(m.birthDate!).getFullYear());

  const children = activeMembers.filter(m => m.relation === FamilyRelation.CHILD);
  const workingMembers = activeMembers.filter(m => m.income && m.income > 0);
  const totalIncome = activeMembers.reduce((sum, m) => sum + (m.income || 0), 0);

  return {
    totalMembers: activeMembers.length,
    dependents: activeMembers.filter(m => m.isDependent).length,
    children: children.length,
    workingMembers: workingMembers.length,
    totalFamilyIncome: totalIncome,
    averageAge: ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0,
    hasElderly: ages.some(age => age >= 65),
    hasDisabled: activeMembers.some(m => m.healthCondition?.toLowerCase().includes('engel')),
  };
}

/**
 * Aile ağacı yapısı oluştur
 */
interface FamilyTreeNode {
  id: string;
  name: string;
  relation: FamilyRelation;
  relationLabel: string;
  status: FamilyMemberStatus;
  statusLabel: string;
  gender?: string;
  age?: number;
  children: FamilyTreeNode[];
}

function buildFamilyTree(members: FamilyMember[]): FamilyTreeNode[] {
  const currentYear = new Date().getFullYear();
  
  // İlişki öncelik sırası
  const relationOrder: FamilyRelation[] = [
    FamilyRelation.SPOUSE,
    FamilyRelation.CHILD,
    FamilyRelation.MOTHER,
    FamilyRelation.FATHER,
    FamilyRelation.SIBLING,
    FamilyRelation.GRANDMOTHER,
    FamilyRelation.GRANDFATHER,
    FamilyRelation.GRANDCHILD,
    FamilyRelation.OTHER_RELATIVE,
    FamilyRelation.DEPENDENT,
  ];

  // Sırala
  const sortedMembers = [...members].sort((a, b) => {
    return relationOrder.indexOf(a.relation) - relationOrder.indexOf(b.relation);
  });

  return sortedMembers.map(m => ({
    id: m.id || '',
    name: `${m.firstName} ${m.lastName}`,
    relation: m.relation,
    relationLabel: RELATION_LABELS[m.relation],
    status: m.status,
    statusLabel: STATUS_LABELS[m.status],
    gender: m.gender,
    age: m.birthDate ? currentYear - new Date(m.birthDate).getFullYear() : undefined,
    children: [], // Gerçek ağaç yapısı için recursive işlem gerekir
  }));
}
