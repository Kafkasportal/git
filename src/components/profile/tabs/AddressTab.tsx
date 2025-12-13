'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ProfileFormState, ProfileFormActions } from '@/hooks/useProfileForm';

interface AddressTabProps {
    state: ProfileFormState;
    actions: ProfileFormActions;
    readOnly: boolean;
}

export function AddressTab({ state, actions, readOnly }: AddressTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Adres Bilgileri</CardTitle>
                <CardDescription>İkamet adresinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                        id="address"
                        value={state.address}
                        onChange={(e) => actions.setAddress(e.target.value)}
                        placeholder="Mahalle, Sokak, No"
                        disabled={readOnly}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">İl</Label>
                        <Input
                            id="city"
                            value={state.city}
                            onChange={function(e) { return actions.setCity(e.target.value) }}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="district">İlçe</Label>
                        <Input
                            id="district"
                            value={state.district}
                            onChange={(e) => actions.setDistrict(e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postal_code">Posta Kodu</Label>
                        <Input
                            id="postal_code"
                            value={state.postalCode}
                            onChange={(e) => actions.setPostalCode(e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
