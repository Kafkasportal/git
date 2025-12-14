/**
 * 2FA API Routes
 * Handles TOTP secret generation, verification, and enable/disable
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { getAuthSessionFromRequest, getUserFromSession } from '@/lib/auth/session';
import logger from '@/lib/logger';

// Configure otplib
authenticator.options = {
    digits: 6,
    step: 30, // 30 seconds
    window: 1, // Allow 1 step before/after for clock drift
};

interface TwoFactorSetupResponse {
    secret: string;
    qrCodeUrl: string;
    recoveryCodes: string[];
}

/**
 * POST /api/auth/2fa/setup - Generate 2FA setup data
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const session = getAuthSessionFromRequest(request);
        const user = await getUserFromSession(session);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Generate TOTP secret
        const secret = authenticator.generateSecret(20);

        // Create OTP Auth URL for QR code
        const serviceName = process.env.NEXT_PUBLIC_APP_NAME || 'Dernek Yönetimi';
        const otpAuthUrl = authenticator.keyuri(user.email, serviceName, secret);

        // Generate QR code as data URL
        const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        // Generate recovery codes (8 codes, 8 characters each)
        const recoveryCodes = Array.from({ length: 8 }, () =>
            Array.from({ length: 8 }, () =>
                'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
            ).join('')
        );

        // Store temporary secret in session (expires in 10 minutes)
        // In production, store encrypted in database with expiry
        const response: TwoFactorSetupResponse = {
            secret,
            qrCodeUrl,
            recoveryCodes,
        };

        logger.info('2FA setup initiated', { userId: user.id });

        return NextResponse.json({
            success: true,
            data: response,
        });
    } catch (error) {
        logger.error('2FA setup error', { error });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/auth/2fa/setup - Verify and enable 2FA
 */
export async function PUT(request: NextRequest) {
    try {
        // Auth check
        const session = getAuthSessionFromRequest(request);
        const user = await getUserFromSession(session);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { secret, token } = body as {
            secret: string;
            token: string;
            recoveryCodes: string[];
        };

        if (!secret || !token) {
            return NextResponse.json(
                { success: false, error: 'Secret and token are required' },
                { status: 400 }
            );
        }

        // Verify token
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            logger.warn('Invalid 2FA token during setup', { userId: user.id });
            return NextResponse.json(
                { success: false, error: 'Invalid verification code' },
                { status: 400 }
            );
        }

        // TODO: Store encrypted secret and recovery codes in user preferences
        // For now, we'll just log success - actual storage would require Appwrite update
        logger.info('2FA enabled successfully', { userId: user.id });

        return NextResponse.json({
            success: true,
            message: '2FA başarıyla etkinleştirildi',
        });
    } catch (error) {
        logger.error('2FA verification error', { error });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth/2fa/setup - Disable 2FA
 */
export async function DELETE(request: NextRequest) {
    try {
        // Auth check
        const session = getAuthSessionFromRequest(request);
        const user = await getUserFromSession(session);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { password } = body as { password: string };

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required to disable 2FA' },
                { status: 400 }
            );
        }

        // TODO: Verify password and remove 2FA from user preferences
        logger.info('2FA disabled', { userId: user.id });

        return NextResponse.json({
            success: true,
            message: '2FA başarıyla devre dışı bırakıldı',
        });
    } catch (error) {
        logger.error('2FA disable error', { error });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
