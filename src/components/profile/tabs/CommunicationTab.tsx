'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    COMMUNICATION_CHANNELS,
    CONTACT_TIMES,
    SUPPORTED_LANGUAGES,
    type CommunicationChannel,
} from '@/types/user-profile';
import type { ProfileFormState, ProfileFormActions } from '@/hooks/useProfileForm';

interface CommunicationTabProps {
    state: ProfileFormState;
    actions: ProfileFormActions;
    readOnly: boolean;
}

export function CommunicationTab({ state, actions, readOnly }: CommunicationTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>İletişim Tercihleri</CardTitle>
                <CardDescription>İletişim kanallarınızı ve tercihlerinizi belirleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Tercih Edilen İletişim Kanalları</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.values(COMMUNICATION_CHANNELS).map((channel) => (
                            <div key={channel.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={channel.id}
                                    checked={state.commChannels.includes(channel.id as CommunicationChannel)}
                                    onCheckedChange={() =>
                                        actions.toggleCommunicationChannel(channel.id as CommunicationChannel)
                                    }
                                    disabled={readOnly}
                                />
                                <Label htmlFor={channel.id} className="text-sm font-normal cursor-pointer">
                                    {channel.labelTr}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label htmlFor="preferred_language">Tercih Edilen Dil</Label>
                    <Select
                        value={state.preferredLang}
                        onValueChange={actions.setPreferredLang}
                        disabled={readOnly}
                    >
                        <SelectTrigger id="preferred_language">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.nativeName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="best_contact_time">En Uygun İletişim Saati</Label>
                    <Select
                        value={state.contactTime}
                        onValueChange={actions.setContactTime}
                        disabled={readOnly}
                    >
                        <SelectTrigger id="best_contact_time">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(CONTACT_TIMES).map((time) => (
                                <SelectItem key={time.id} value={time.id}>
                                    {time.labelTr} ({time.hours})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="space-y-3">
                    <Label>Bildirim Tercihleri</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="email_notifications"
                            checked={state.emailNotif}
                            onCheckedChange={(checked) => actions.setEmailNotif(checked as boolean)}
                            disabled={readOnly}
                        />
                        <Label htmlFor="email_notifications" className="text-sm font-normal cursor-pointer">
                            E-posta bildirimleri
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="sms_notifications"
                            checked={state.smsNotif}
                            onCheckedChange={(checked) => actions.setSmsNotif(checked as boolean)}
                            disabled={readOnly}
                        />
                        <Label htmlFor="sms_notifications" className="text-sm font-normal cursor-pointer">
                            SMS bildirimleri
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="newsletter_subscription"
                            checked={state.newsletter}
                            onCheckedChange={(checked) => actions.setNewsletter(checked as boolean)}
                            disabled={readOnly}
                        />
                        <Label
                            htmlFor="newsletter_subscription"
                            className="text-sm font-normal cursor-pointer"
                        >
                            Bülten ve duyurular
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
