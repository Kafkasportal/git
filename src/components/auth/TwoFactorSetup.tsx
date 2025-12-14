'use client';

/**
 * TwoFactorSetup - User-facing 2FA Setup Component
 * Displays QR code and handles TOTP verification for enabling 2FA
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Smartphone,
    Shield,
    Copy,
    Check,
    RefreshCw,
    Download,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
    /** Whether 2FA is currently enabled */
    isEnabled?: boolean;
    /** Callback when 2FA is successfully enabled */
    onEnabled?: () => void;
    /** Callback when 2FA is disabled */
    onDisabled?: () => void;
}

interface SetupData {
    secret: string;
    qrCodeUrl: string;
    recoveryCodes: string[];
}

type SetupStep = 'intro' | 'qrcode' | 'verify' | 'recovery' | 'complete';

export function TwoFactorSetup({ isEnabled = false, onEnabled, onDisabled }: TwoFactorSetupProps) {
    const [step, setStep] = useState<SetupStep>('intro');
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    // Generate 2FA setup
    const setupMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
            });
            if (!response.ok) throw new Error('2FA kurulumu başlatılamadı');
            const result = await response.json();
            return result.data as SetupData;
        },
        onSuccess: (data) => {
            setSetupData(data);
            setStep('qrcode');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : '2FA kurulumu başarısız');
        },
    });

    // Verify and enable 2FA
    const verifyMutation = useMutation({
        mutationFn: async () => {
            if (!setupData) throw new Error('Kurulum verisi bulunamadı');

            const response = await fetch('/api/auth/2fa/setup', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: setupData.secret,
                    token: verificationCode,
                    recoveryCodes: setupData.recoveryCodes,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Doğrulama başarısız');
            }

            return response.json();
        },
        onSuccess: () => {
            setStep('recovery');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Kod doğrulanamadı');
            setVerificationCode('');
        },
    });

    // Disable 2FA
    const disableMutation = useMutation({
        mutationFn: async (password: string) => {
            const response = await fetch('/api/auth/2fa/setup', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) throw new Error('2FA devre dışı bırakılamadı');
            return response.json();
        },
        onSuccess: () => {
            toast.success('2FA devre dışı bırakıldı');
            onDisabled?.();
        },
    });

    // Copy to clipboard
    const copyToClipboard = useCallback(async (text: string, type: 'secret' | 'codes') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'secret') {
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
            } else {
                setCopiedCodes(true);
                setTimeout(() => setCopiedCodes(false), 2000);
            }
            toast.success('Kopyalandı!');
        } catch {
            toast.error('Kopyalanamadı');
        }
    }, []);

    // Handle complete
    const handleComplete = useCallback(() => {
        setStep('complete');
        onEnabled?.();
    }, [onEnabled]);

    // Already enabled state
    if (isEnabled) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        2FA Aktif
                    </CardTitle>
                    <CardDescription>
                        Hesabınız iki faktörlü kimlik doğrulama ile korunuyor
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            const password = prompt('2FA\'yı devre dışı bırakmak için şifrenizi girin:');
                            if (password) disableMutation.mutate(password);
                        }}
                        disabled={disableMutation.isPending}
                    >
                        {disableMutation.isPending ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> İşleniyor...</>
                        ) : (
                            '2FA\'yı Devre Dışı Bırak'
                        )}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    İki Faktörlü Kimlik Doğrulama (2FA)
                </CardTitle>
                <CardDescription>
                    Hesabınızı ekstra güvenlik katmanı ile koruyun
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Step: Intro */}
                {step === 'intro' && (
                    <div className="space-y-4">
                        <Alert>
                            <Smartphone className="w-4 h-4" />
                            <AlertTitle>Authenticator Uygulaması Gerekli</AlertTitle>
                            <AlertDescription>
                                Google Authenticator, Authy veya Microsoft Authenticator gibi bir
                                TOTP uygulaması indirmeniz gerekmektedir.
                            </AlertDescription>
                        </Alert>
                        <Button
                            onClick={() => setupMutation.mutate()}
                            disabled={setupMutation.isPending}
                            className="w-full"
                        >
                            {setupMutation.isPending ? (
                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Hazırlanıyor...</>
                            ) : (
                                <><Shield className="w-4 h-4 mr-2" /> 2FA Kurulumunu Başlat</>
                            )}
                        </Button>
                    </div>
                )}

                {/* Step: QR Code */}
                {step === 'qrcode' && setupData && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                Authenticator uygulamanızla aşağıdaki QR kodunu tarayın
                            </p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={setupData.qrCodeUrl}
                                alt="2FA QR Code"
                                className="mx-auto rounded-lg border shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                QR kod çalışmıyorsa bu kodu manuel girin:
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={setupData.secret}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                                >
                                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button onClick={() => setStep('verify')} className="w-full">
                            Devam Et
                        </Button>
                    </div>
                )}

                {/* Step: Verify */}
                {step === 'verify' && (
                    <div className="space-y-4">
                        <Alert>
                            <AlertTriangle className="w-4 h-4" />
                            <AlertTitle>Doğrulama Gerekli</AlertTitle>
                            <AlertDescription>
                                Authenticator uygulamasındaki 6 haneli kodu girin
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="verification-code">Doğrulama Kodu</Label>
                            <Input
                                id="verification-code"
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="text-center text-2xl font-mono tracking-widest"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('qrcode')} className="flex-1">
                                Geri
                            </Button>
                            <Button
                                onClick={() => verifyMutation.mutate()}
                                disabled={verificationCode.length !== 6 || verifyMutation.isPending}
                                className="flex-1"
                            >
                                {verifyMutation.isPending ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Doğrulanıyor...</>
                                ) : (
                                    'Doğrula'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Recovery Codes */}
                {step === 'recovery' && setupData && (
                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertTitle>Kurtarma Kodlarını Kaydedin!</AlertTitle>
                            <AlertDescription>
                                Bu kodları güvenli bir yere kaydedin. Telefonunuzu kaybederseniz
                                bu kodlarla hesabınıza erişebilirsiniz. Her kod yalnızca bir kez kullanılabilir.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                            {setupData.recoveryCodes.map((code, i) => (
                                <div key={i} className="p-2 bg-background rounded text-center">
                                    {code}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(setupData.recoveryCodes.join('\n'), 'codes')}
                                className="flex-1"
                            >
                                {copiedCodes ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                Kopyala
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const blob = new Blob([setupData.recoveryCodes.join('\n')], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = '2fa-recovery-codes.txt';
                                    a.click();
                                }}
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" /> İndir
                            </Button>
                        </div>

                        <Button onClick={handleComplete} className="w-full">
                            Kurulumu Tamamla
                        </Button>
                    </div>
                )}

                {/* Step: Complete */}
                {step === 'complete' && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="p-4 bg-green-100 rounded-full">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-600">2FA Başarıyla Etkinleştirildi!</h3>
                            <p className="text-sm text-muted-foreground">
                                Hesabınız artık iki faktörlü kimlik doğrulama ile korunuyor.
                            </p>
                        </div>
                        <Badge variant="default" className="text-center">
                            <Shield className="w-3 h-3 mr-1" /> Güvenli
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default TwoFactorSetup;
