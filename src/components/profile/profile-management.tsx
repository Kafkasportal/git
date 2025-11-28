'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User,
  MapPin,
  FileText,
  Users,
  Bell,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  EnhancedUserProfile,
  EmergencyContact,
  BLOOD_TYPE_CONFIGS,
  RELATIONSHIP_TYPES,
  COMMUNICATION_CHANNELS,
  CONTACT_TIMES,
  SUPPORTED_LANGUAGES,
  validatePassport,
  calculateAge,
  type BloodType,
  type CommunicationChannel,
} from '@/types/user-profile';

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
  const [hasChanges, setHasChanges] = useState(false);

  // State management
  const [name, setName] = useState(user.name);
  const [birthDate, setBirthDate] = useState(user.birth_date || '');
  const [bloodType, setBloodType] = useState(user.blood_type || '');
  const [nationality, setNationality] = useState(user.nationality || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [city, setCity] = useState(user.city || '');
  const [district, setDistrict] = useState(user.district || '');
  const [postalCode, setPostalCode] = useState(user.postal_code || '');
  const [passportNumber, setPassportNumber] = useState(user.passport_number || '');
  const [passportIssueDate, setPassportIssueDate] = useState(user.passport_issue_date || '');
  const [passportExpiryDate, setPassportExpiryDate] = useState(user.passport_expiry_date || '');
  const [passportCountry, setPassportCountry] = useState(user.passport_issuing_country || '');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    user.emergency_contacts || []
  );
  const [commChannels, setCommChannels] = useState<CommunicationChannel[]>(
    user.communication_channels || []
  );
  const [preferredLang, setPreferredLang] = useState(user.preferred_language || 'tr');
  const [newsletter, setNewsletter] = useState(user.newsletter_subscription || false);
  const [smsNotif, setSmsNotif] = useState<boolean>(user.sms_notifications || true);
  const [emailNotif, setEmailNotif] = useState<boolean>(user.email_notifications || true);
  const [contactTime, setContactTime] = useState(user.best_contact_time || 'anytime');

  const passportValidation = validatePassport({
    passport_number: passportNumber,
    passport_issue_date: passportIssueDate,
    passport_expiry_date: passportExpiryDate,
    passport_issuing_country: passportCountry,
  });

  const userAge = birthDate ? calculateAge(birthDate) : null;

  const handleSave = async () => {
    if (!onUpdate) return;

    const updates: Partial<EnhancedUserProfile> = {
      name,
      birth_date: birthDate || undefined,
      blood_type: (bloodType || undefined) as BloodType | undefined,
      nationality: nationality || undefined,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      district: district || undefined,
      postal_code: postalCode || undefined,
      passport_number: passportNumber || undefined,
      passport_issue_date: passportIssueDate || undefined,
      passport_expiry_date: passportExpiryDate || undefined,
      passport_issuing_country: passportCountry || undefined,
      emergency_contacts: emergencyContacts,
      communication_channels: commChannels,
      preferred_language: preferredLang,
      newsletter_subscription: newsletter,
      sms_notifications: smsNotif,
      email_notifications: emailNotif,
      best_contact_time: contactTime,
    };

    await onUpdate(updates);
    setHasChanges(false);
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      {
        name: '',
        relationship: '',
        phone: '',
        email: '',
        isPrimary: emergencyContacts.length === 0,
      },
    ]);
    setHasChanges(true);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: EmergencyContact[keyof EmergencyContact]) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEmergencyContacts(updated);
    setHasChanges(true);
  };

  const setPrimaryContact = (index: number) => {
    const updated = emergencyContacts.map((contact, i) => ({
      ...contact,
      isPrimary: i === index,
    }));
    setEmergencyContacts(updated);
    setHasChanges(true);
  };

  const toggleCommunicationChannel = (channel: CommunicationChannel) => {
    const updated = commChannels.includes(channel)
      ? commChannels.filter((c) => c !== channel)
      : [...commChannels, channel];
    setCommChannels(updated);
    setHasChanges(true);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profil Yönetimi</h2>
          <p className="text-muted-foreground">
            Kişisel bilgilerinizi, acil durum iletişim bilgilerinizi ve tercihlerinizi yönetin
          </p>
        </div>
        {hasChanges && !readOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        )}
      </div>

      {/* Passport Expiry Warning */}
      {passportValidation.warningLevel && passportValidation.warningLevel !== 'none' && (
        <Alert variant={passportValidation.warningLevel === 'expired' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {passportValidation.warningLevel === 'expired' &&
              'Pasaportunuzun süresi dolmuş. Lütfen yenileyin.'}
            {passportValidation.warningLevel === 'urgent' &&
              `Pasaportunuzun süresi ${passportValidation.daysUntilExpiry} gün içinde dolacak!`}
            {passportValidation.warningLevel === 'warning' &&
              `Pasaportunuzun süresi ${passportValidation.daysUntilExpiry} gün içinde dolacak.`}
          </AlertDescription>
        </Alert>
      )}

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

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>Temel kişisel bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" value={user.email} disabled />
                  <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="+90 (XXX) XXX XX XX"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Doğum Tarihi</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                  {userAge && <p className="text-xs text-muted-foreground">Yaş: {userAge}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_type">Kan Grubu</Label>
                  <Select
                    value={bloodType}
                    onValueChange={(value) => {
                      setBloodType(value);
                      setHasChanges(true);
                    }}
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
                    value={nationality}
                    onChange={(e) => {
                      setNationality(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="Türkiye Cumhuriyeti"
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-4">
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
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Mahalle, Sokak, No"
                  disabled={readOnly}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">İl</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">İlçe</Label>
                  <Input
                    id="district"
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Posta Kodu</Label>
                  <Input
                    id="postal_code"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passport Tab */}
        <TabsContent value="passport" className="space-y-4">
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
                    value={passportNumber}
                    onChange={(e) => {
                      setPassportNumber(e.target.value.toUpperCase());
                      setHasChanges(true);
                    }}
                    placeholder="U12345678"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_issuing_country">Düzenleyen Ülke</Label>
                  <Input
                    id="passport_issuing_country"
                    value={passportCountry}
                    onChange={(e) => {
                      setPassportCountry(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="Türkiye"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_issue_date">Düzenleme Tarihi</Label>
                  <Input
                    id="passport_issue_date"
                    type="date"
                    value={passportIssueDate}
                    onChange={(e) => {
                      setPassportIssueDate(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_expiry_date">Son Kullanma Tarihi</Label>
                  <Input
                    id="passport_expiry_date"
                    type="date"
                    value={passportExpiryDate}
                    onChange={(e) => {
                      setPassportExpiryDate(e.target.value);
                      setHasChanges(true);
                    }}
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
        </TabsContent>

        {/* Emergency Contacts Tab - Continued in next file part */}
        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acil Durum İletişim Bilgileri</CardTitle>
              <CardDescription>
                Acil durumlarda sizinle iletişime geçilecek kişileri ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Henüz acil durum iletişim bilgisi eklenmemiş
                  </p>
                  {!readOnly && (
                    <Button onClick={addEmergencyContact}>
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Kişiyi Ekle
                    </Button>
                  )}
                </div>
              ) : (
                <>
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
                              onChange={(e) =>
                                updateEmergencyContact(index, 'name', e.target.value)
                              }
                              placeholder="Ad Soyad"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>İlişki</Label>
                            <Select
                              value={contact.relationship}
                              onValueChange={(value) =>
                                updateEmergencyContact(index, 'relationship', value)
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
                              onChange={(e) =>
                                updateEmergencyContact(index, 'phone', e.target.value)
                              }
                              placeholder="+90 (XXX) XXX XX XX"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>E-posta (Opsiyonel)</Label>
                            <Input
                              value={contact.email || ''}
                              onChange={(e) =>
                                updateEmergencyContact(index, 'email', e.target.value)
                              }
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
                                onClick={() => setPrimaryContact(index)}
                              >
                                Birincil Yap
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEmergencyContact(index)}
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
                    <Button onClick={addEmergencyContact} variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Kişi Ekle
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Preferences Tab */}
        <TabsContent value="communication" className="space-y-4">
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
                        checked={commChannels.includes(channel.id)}
                        onCheckedChange={() => toggleCommunicationChannel(channel.id)}
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
                  value={preferredLang}
                  onValueChange={(value) => {
                    setPreferredLang(value);
                    setHasChanges(true);
                  }}
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
                  value={contactTime}
                  onValueChange={(value) => {
                    setContactTime(value);
                    setHasChanges(true);
                  }}
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
                    checked={emailNotif}
                    onCheckedChange={(checked) => {
                      setEmailNotif(checked as boolean);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                  <Label
                    htmlFor="email_notifications"
                    className="text-sm font-normal cursor-pointer"
                  >
                    E-posta bildirimleri
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms_notifications"
                    checked={smsNotif}
                    onCheckedChange={(checked) => {
                      setSmsNotif(checked as boolean);
                      setHasChanges(true);
                    }}
                    disabled={readOnly}
                  />
                  <Label htmlFor="sms_notifications" className="text-sm font-normal cursor-pointer">
                    SMS bildirimleri
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter_subscription"
                    checked={newsletter}
                    onCheckedChange={(checked) => {
                      setNewsletter(checked as boolean);
                      setHasChanges(true);
                    }}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
