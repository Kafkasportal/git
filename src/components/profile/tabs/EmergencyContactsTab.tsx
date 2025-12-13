'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Trash2 } from 'lucide-react';
import { RELATIONSHIP_TYPES } from '@/types/user-profile';
import type { ProfileFormState, ProfileFormActions } from '@/hooks/useProfileForm';

interface EmergencyContactsTabProps {
    state: ProfileFormState;
    actions: ProfileFormActions;
    readOnly: boolean;
}

export function EmergencyContactsTab({ state, actions, readOnly }: EmergencyContactsTabProps) {
    const { emergencyContacts } = state;

    if (emergencyContacts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acil Durum İletişim Bilgileri</CardTitle>
                    <CardDescription>
                        Acil durumlarda sizinle iletişime geçilecek kişileri ekleyin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            Henüz acil durum iletişim bilgisi eklenmemiş
                        </p>
                        {!readOnly && (
                            <Button onClick={actions.addEmergencyContact}>
                                <Plus className="h-4 w-4 mr-2" />
                                İlk Kişiyi Ekle
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Acil Durum İletişim Bilgileri</CardTitle>
                <CardDescription>
                    Acil durumlarda sizinle iletişime geçilecek kişileri ekleyin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                    <Card key={index} className="relative">
                        <CardContent className="pt-6">
                            {contact.isPrimary && (
                                <Badge className="absolute top-2 right-2" variant="default">
                                    Birincil
                                </Badge>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ad Soyad</Label>
                                    <Input
                                        value={contact.name}
                                        onChange={(e) => actions.updateEmergencyContact(index, 'name', e.target.value)}
                                        placeholder="Ad Soyad"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>İlişki</Label>
                                    <Select
                                        value={contact.relationship}
                                        onValueChange={(value) =>
                                            actions.updateEmergencyContact(index, 'relationship', value)
                                        }
                                        disabled={readOnly}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="İlişki türü seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(RELATIONSHIP_TYPES).map((rel) => (
                                                <SelectItem key={rel.id} value={rel.id}>
                                                    {rel.labelTr}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefon</Label>
                                    <Input
                                        value={contact.phone}
                                        onChange={(e) => actions.updateEmergencyContact(index, 'phone', e.target.value)}
                                        placeholder="+90 (XXX) XXX XX XX"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-posta (Opsiyonel)</Label>
                                    <Input
                                        value={contact.email || ''}
                                        onChange={(e) => actions.updateEmergencyContact(index, 'email', e.target.value)}
                                        type="email"
                                        placeholder="ornek@email.com"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                            {!readOnly && (
                                <div className="flex gap-2 mt-4">
                                    {!contact.isPrimary && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => actions.setPrimaryContact(index)}
                                        >
                                            Birincil Yap
                                        </Button>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => actions.removeEmergencyContact(index)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Kaldır
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {!readOnly && (
                    <Button onClick={actions.addEmergencyContact} variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Kişi Ekle
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
