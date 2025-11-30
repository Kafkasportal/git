import { NextRequest, NextResponse } from 'next/server';
import { appwriteDonations } from '@/lib/appwrite/api';
import logger from '@/lib/logger';
import type { DonationDocument } from '@/types/database';
import type { DonationUpdateInput, PaymentMethod } from '@/lib/api/types';

/**
 * Validate kumbara donation update payload
 */
function validateKumbaraUpdate(data: Partial<DonationDocument>): {
  isValid: boolean;
  errors: string[];
  normalizedData?: Partial<DonationDocument>;
} {
  const errors: string[] = [];

  // Validate fields that can be updated
  if (data.amount !== undefined && (data.amount === null || Number(data.amount) <= 0)) {
    errors.push('Bağış tutarı pozitif olmalıdır');
  }
  if (data.kumbara_location && data.kumbara_location.trim().length < 2) {
    errors.push('Kumbara lokasyonu en az 2 karakter olmalıdır');
  }
  if (data.kumbara_institution && data.kumbara_institution.trim().length < 2) {
    errors.push('Kumbara kurum/adres bilgisi en az 2 karakter olmalıdır');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Normalize data - ensure it's a kumbara donation
  const normalizedData = {
    ...data,
    is_kumbara: true, // Maintain kumbara flag
  };

  return { isValid: true, errors: [], normalizedData };
}

/**
 * GET /api/kumbara/[id]
 * Get single kumbara donation
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kumbara bağış ID gereklidir' },
        { status: 400 }
      );
    }

    // Fetch donation from Appwrite
    const donation = (await appwriteDonations.get(id as string)) as DonationDocument | null;

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Kumbara bağışı bulunamadı' },
        { status: 404 }
      );
    }

    // Ensure it's a kumbara donation
    if (!donation.is_kumbara) {
      return NextResponse.json(
        { success: false, error: 'Bu ID bir kumbara bağışına ait değil' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: donation,
    });
  } catch (_error: unknown) {
    logger.error('Error fetching kumbara donation', _error);
    return NextResponse.json(
      { success: false, error: 'Kumbara bağışı getirilemedi' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/kumbara/[id]
 * Update kumbara donation
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<DonationDocument>;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kumbara bağış ID gereklidir' },
        { status: 400 }
      );
    }

    // First, check if donation exists and is a kumbara donation
    const existingDonation = (await appwriteDonations.get(id as string)) as DonationDocument | null;
    if (!existingDonation) {
      return NextResponse.json(
        { success: false, error: 'Kumbara bağışı bulunamadı' },
        { status: 404 }
      );
    }

    if (!existingDonation.is_kumbara) {
      return NextResponse.json(
        { success: false, error: 'Bu ID bir kumbara bağışına ait değil' },
        { status: 404 }
      );
    }

    // Validate update data
    const validation = validateKumbaraUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doğrulama hatası',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Update donation in Appwrite
    if (validation.normalizedData) {
      const { payment_method, ...restData } = validation.normalizedData;
      const updateData: DonationUpdateInput = {
        ...restData,
        ...(payment_method && { payment_method: payment_method as PaymentMethod }),
      };
      await appwriteDonations.update(id as string, updateData);
    }

    logger.info('Updated kumbara donation', {
      donationId: id,
      updatedFields: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      message: 'Kumbara bağışı başarıyla güncellendi',
    });
  } catch (_error: unknown) {
    logger.error('Error updating kumbara donation', _error);
    return NextResponse.json(
      { success: false, error: 'Kumbara bağışı güncellenemedi' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kumbara/[id]
 * Delete kumbara donation
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kumbara bağış ID gereklidir' },
        { status: 400 }
      );
    }

    // First, check if donation exists and is a kumbara donation
    const existingDonation = (await appwriteDonations.get(id as string)) as DonationDocument | null;
    if (!existingDonation) {
      return NextResponse.json(
        { success: false, error: 'Kumbara bağışı bulunamadı' },
        { status: 404 }
      );
    }

    if (!existingDonation.is_kumbara) {
      return NextResponse.json(
        { success: false, error: 'Bu ID bir kumbara bağışına ait değil' },
        { status: 404 }
      );
    }

    // Delete donation from Appwrite
    await appwriteDonations.remove(id as string);

    logger.info('Deleted kumbara donation', {
      donationId: id,
      amount: existingDonation.amount,
      location: existingDonation.kumbara_location,
    });

    return NextResponse.json({
      success: true,
      message: 'Kumbara bağışı başarıyla silindi',
    });
  } catch (_error: unknown) {
    logger.error('Error deleting kumbara donation', _error);
    return NextResponse.json(
      { success: false, error: 'Kumbara bağışı silinemedi' },
      { status: 500 }
    );
  }
}
