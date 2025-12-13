'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validatePassport } from '@/types/user-profile';
import type { ProfileFormState, ProfileFormActions } from '@/hooks/useProfileForm';

interface PassportTabProps {
    state: ProfileFormState;
    actions: ProfileFormActions;
    passportValidation: ReturnType<typeof validatePassport>;
    readOnly: boolean;
}

export function PassportTab({ state, actions, passportValidation, readOnly }: PassportTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pasaport Bilgileri</CardTitle>
                <CardDescription>
                    Pasaport bilgilerinizi güncelleyin ve süre takibi yapın
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="passport_number">Pasaport Numarası</Label>
                        <Input
                            id="passport_number"
                            value={state.passportNumber}
                            onChange={(e) => actions.setPassportNumber(e.target.value)}
                            placeholder="U12345678"
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="passport_issuing_country">Düzenleyen Ülke</Label>
                        <Input
                            id="passport_issuing_country"
                            value={state.passportCountry}
                            onChange={(e) => actions.setPassportCountry(e.target.value)}
                            placeholder="Türkiye"
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="passport_issue_date">Düzenleme Tarihi</Label>
                        <Input
                            id="passport_issue_date"
                            type="date"
                            value={state.passportIssueDate}
                            onChange={function(e) { return actions.setPassportIssueDate(e.target.value) }}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="passport_expiry_date">Son Kullanma Tarihi</Label>
                        <Input
                            id="passport_expiry_date"
                            type="date"
                            value={state.passportExpiryDate}
                            onChange={(e) => actions.setPassportExpiryDate(e.target.value)}
                            disabled={readOnly}
                        />
                        {passportValidation.daysUntilExpiry !== undefined && (
                            <p className="text-xs text-muted-foreground">
                                {passportValidation.isExpired
                                    ? 'Süresi dolmuş'
                                    : `${passportValidation.daysUntilExpiry} gün kaldı`}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
