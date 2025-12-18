'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BLOOD_TYPE_CONFIGS } from '@/types/user-profile';
import type { ProfileFormState, ProfileFormActions } from '@/hooks/useProfileForm';

interface PersonalInfoTabProps {
    state: ProfileFormState;
    actions: ProfileFormActions;
    userAge: number | null;
    userEmail: string;
    readOnly: boolean;
}

export function PersonalInfoTab({
    state,
    actions,
    userAge,
    userEmail,
    readOnly,
}: PersonalInfoTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Kişisel Bilgiler</CardTitle>
                <CardDescription>Temel kişisel bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                            id="name"
                            value={state.name}
                            onChange={(e) => actions.setName(e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" value={userEmail} disabled />
                        <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                            id="phone"
                            value={state.phone}
                            onChange={(e) => actions.setPhone(e.target.value)}
                            placeholder="+90 (XXX) XXX XX XX"
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="birth_date">Doğum Tarihi</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={state.birthDate}
                            onChange={(e) => actions.setBirthDate(e.target.value)}
                            disabled={readOnly}
                        />
                        {userAge && <p className="text-xs text-muted-foreground">Yaş: {userAge}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="blood_type">Kan Grubu</Label>
                        <Select
                            value={state.bloodType}
                            onValueChange={actions.setBloodType}
                            disabled={readOnly}
                        >
                            <SelectTrigger id="blood_type">
                                <SelectValue placeholder="Kan grubunu seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {BLOOD_TYPE_CONFIGS.map((config) => (
                                    <SelectItem key={config.value} value={config.value}>
                                        {config.labelTr}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nationality">Uyruk</Label>
                        <Input
                            id="nationality"
                            value={state.nationality}
                            onChange={(e) => actions.setNationality(e.target.value)}
                            placeholder="Türkiye Cumhuriyeti"
                            disabled={readOnly}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
