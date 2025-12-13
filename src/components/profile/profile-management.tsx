'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, MapPin, FileText, Users, Bell, AlertCircle, Check, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { EnhancedUserProfile } from '@/types/user-profile';
import { useProfileForm } from '@/hooks/useProfileForm';
import {
  PersonalInfoTab,
  AddressTab,
  PassportTab,
  EmergencyContactsTab,
  CommunicationTab,
} from './tabs';

export interface ProfileManagementProps {
  user: EnhancedUserProfile;
  onUpdate?: (updates: Partial<EnhancedUserProfile>) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ProfileManagement({
  user,
  onUpdate,
  isLoading = false,
  readOnly = false,
}: ProfileManagementProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const { state, actions, hasChanges, setHasChanges, passportValidation, userAge, buildUpdates } =
    useProfileForm(user);

  const handleSave = useCallback(async () => {
    if (!onUpdate) return;
    await onUpdate(buildUpdates());
    setHasChanges(false);
  }, [onUpdate, buildUpdates, setHasChanges]);

  const handleCancel = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <ProfileHeader
        hasChanges={hasChanges}
        readOnly={readOnly}
        isLoading={isLoading}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Passport Expiry Warning */}
      <PassportWarning passportValidation={passportValidation} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">
            <User className="h-4 w-4 mr-2" />
            Kişisel Bilgiler
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="h-4 w-4 mr-2" />
            Adres
          </TabsTrigger>
          <TabsTrigger value="passport">
            <FileText className="h-4 w-4 mr-2" />
            Pasaport
          </TabsTrigger>
          <TabsTrigger value="emergency">
            <Users className="h-4 w-4 mr-2" />
            Acil Durum
          </TabsTrigger>
          <TabsTrigger value="communication">
            <Bell className="h-4 w-4 mr-2" />
            İletişim Tercihleri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <PersonalInfoTab
            state={state}
            actions={actions}
            userAge={userAge}
            userEmail={user.email}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <AddressTab state={state} actions={actions} readOnly={readOnly} />
        </TabsContent>

        <TabsContent value="passport" className="space-y-4">
          <PassportTab
            state={state}
            actions={actions}
            passportValidation={passportValidation}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <EmergencyContactsTab state={state} actions={actions} readOnly={readOnly} />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <CommunicationTab state={state} actions={actions} readOnly={readOnly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for better organization
interface ProfileHeaderProps {
  hasChanges: boolean;
  readOnly: boolean;
  isLoading: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function ProfileHeader({ hasChanges, readOnly, isLoading, onSave, onCancel }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profil Yönetimi</h2>
        <p className="text-muted-foreground">
          Kişisel bilgilerinizi, acil durum iletişim bilgilerinizi ve tercihlerinizi yönetin
        </p>
      </div>
      {hasChanges && !readOnly && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            <Check className="h-4 w-4 mr-2" />
            {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface PassportWarningProps {
  passportValidation: {
    warningLevel?: 'none' | 'warning' | 'urgent' | 'expired';
    daysUntilExpiry?: number;
  };
}

function PassportWarning({ passportValidation }: PassportWarningProps) {
  if (!passportValidation.warningLevel || passportValidation.warningLevel === 'none') {
    return null;
  }

  const getMessage = () => {
    switch (passportValidation.warningLevel) {
      case 'expired':
        return 'Pasaportunuzun süresi dolmuş. Lütfen yenileyin.';
      case 'urgent':
        return `Pasaportunuzun süresi ${passportValidation.daysUntilExpiry} gün içinde dolacak!`;
      case 'warning':
        return `Pasaportunuzun süresi ${passportValidation.daysUntilExpiry} gün içinde dolacak.`;
      default:
        return null;
    }
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <Alert variant={passportValidation.warningLevel === 'expired' ? 'destructive' : 'default'}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
