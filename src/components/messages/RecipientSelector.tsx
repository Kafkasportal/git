'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { toast } from 'sonner';
import {
  Search,
  Users,
  Heart,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Download,
  Upload,
} from 'lucide-react';
import { validateRecipients, formatPhoneNumber } from '@/lib/validations/message';
import type { BeneficiaryDocument, DonationDocument, UserDocument } from '@/types/database';

interface RecipientSelectorProps {
  messageType: 'sms' | 'email' | 'internal' | 'whatsapp';
  selectedRecipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
  maxRecipients?: number;
}

interface RecipientItem {
  id: string;
  name: string;
  contact: string;
  city?: string;
  lastDonation?: string;
  role?: string;
  email?: string;
}

export function RecipientSelector({
  messageType,
  selectedRecipients,
  onRecipientsChange,
  maxRecipients = 100,
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientSource, setRecipientSource] = useState<
    'beneficiaries' | 'donors' | 'users' | 'custom'
  >('beneficiaries');
  const [selectAll, setSelectAll] = useState(false);
  const [customRecipients, setCustomRecipients] = useState('');

  // Fetch beneficiaries
  const { data: beneficiariesResponse, isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries', searchQuery],
    queryFn: () =>
      api.beneficiaries.getBeneficiaries({
        search: searchQuery,
        limit: 100,
      }),
  });

  // Fetch donations (for unique donors)
  const { data: donationsResponse, isLoading: isLoadingDonations } = useQuery({
    queryKey: ['donations', searchQuery],
    queryFn: () =>
      api.donations.getDonations({
        search: searchQuery,
        limit: 100,
      }),
  });

  // Fetch users (for internal messages)
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () =>
      api.users.getUsers({
        limit: 100,
      }),
  });

  const beneficiaries = beneficiariesResponse?.data || [];
  const donations = donationsResponse?.data || [];
  const users = usersResponse?.data || [];

  // Process recipients based on message type
  const getRecipients = (): RecipientItem[] => {
    switch (recipientSource) {
      case 'beneficiaries':
        return beneficiaries
          .filter((beneficiary: BeneficiaryDocument) => {
            if (messageType === 'sms' && !beneficiary.phone) return false;
            if (messageType === 'email' && !beneficiary.email) return false;
            if (messageType === 'internal') return false; // Internal messages don't use beneficiaries
            return true;
          })
          .map((beneficiary: BeneficiaryDocument) => ({
            id: beneficiary.$id || beneficiary._id || '',
            name: beneficiary.name,
            contact: messageType === 'sms' ? beneficiary.phone || '' : beneficiary.email || '',
            city: beneficiary.city,
          }));

      case 'donors':
        // Extract unique donors from donations
        const uniqueDonors = new Map();
        donations.forEach((donation: DonationDocument) => {
          if (donation.donor_name && donation.donor_phone) {
            const key = donation.donor_phone;
            if (!uniqueDonors.has(key)) {
              uniqueDonors.set(key, {
                id: key,
                name: donation.donor_name,
                contact: donation.donor_phone,
                lastDonation: donation.$createdAt || donation._creationTime,
              });
            }
          }
        });
        return Array.from(uniqueDonors.values()).filter((donor: { contact?: string; [key: string]: unknown }) => {
          if (messageType === 'sms' && !donor.contact) return false;
          if (messageType === 'email') return false; // Donations don't have email
          if (messageType === 'internal') return false;
          return true;
        });

      case 'users':
        return users
          .filter((_user: UserDocument) => {
            if (messageType === 'internal') return true;
            return false; // Users are only for internal messages
          })
          .map((user: UserDocument) => ({
            id: user.$id || user._id || '',
            name: user.name,
            contact: user.email,
            role: user.role,
            email: user.email,
          }));

      case 'custom':
        return [];

      default:
        return [];
    }
  };

  const recipients = getRecipients();

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all from current source
      const currentSourceRecipients = recipients.map((r) => r.contact).filter(Boolean);
      const updatedRecipients = selectedRecipients.filter(
        (recipient) => !currentSourceRecipients.includes(recipient)
      );
      onRecipientsChange(updatedRecipients);
    } else {
      // Select all from current source
      const currentSourceRecipients = recipients.map((r) => r.contact).filter(Boolean);
      const newRecipients = [...selectedRecipients];

      currentSourceRecipients.forEach((recipient) => {
        if (!newRecipients.includes(recipient) && newRecipients.length < maxRecipients) {
          newRecipients.push(recipient);
        }
      });

      onRecipientsChange(newRecipients);
    }
    setSelectAll(!selectAll);
  };

  // Handle individual selection
  const handleRecipientToggle = (contact: string) => {
    if (selectedRecipients.includes(contact)) {
      onRecipientsChange(selectedRecipients.filter((r) => r !== contact));
    } else {
      if (selectedRecipients.length < maxRecipients) {
        onRecipientsChange([...selectedRecipients, contact]);
      } else {
        toast.warning(`En fazla ${maxRecipients} alıcı seçebilirsiniz.`);
      }
    }
  };

  // Handle custom recipients
  const handleCustomRecipientsChange = (value: string) => {
    setCustomRecipients(value);

    // Parse comma-separated values
    const recipients = value
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    // Validate recipients
    const validationErrors = validateRecipients(recipients, messageType);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    // Update selected recipients
    const validRecipients = recipients.filter((r) => {
      const errors = validateRecipients([r], messageType);
      return errors.length === 0;
    });

    onRecipientsChange(validRecipients);
  };

  // Remove recipient
  const handleRemoveRecipient = (recipient: string) => {
    onRecipientsChange(selectedRecipients.filter((r) => r !== recipient));
  };

  // Export selected recipients
  const handleExportRecipients = () => {
    const csvContent = selectedRecipients.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-recipients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Import recipients from file
  const handleImportRecipients = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const recipients = content
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const validationErrors = validateRecipients(recipients, messageType);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      onRecipientsChange(recipients);
      toast.success(`${recipients.length} alıcı içe aktarıldı.`);
    };
    reader.readAsText(file);
  };

  const getContactIcon = () => {
    switch (messageType) {
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'internal':
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getContactLabel = () => {
    switch (messageType) {
      case 'sms':
        return 'Telefon';
      case 'email':
        return 'E-posta';
      case 'internal':
        return 'Kullanıcı';
      default:
        return 'İletişim';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getContactIcon()}
          <h3 className="text-lg font-semibold">Alıcı Seçimi</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {selectedRecipients.length}/{maxRecipients} seçildi
          </span>
          {selectedRecipients.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportRecipients}>
              <Download className="h-4 w-4 mr-1" />
              Dışa Aktar
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Alıcı ara..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />
      </div>

      {/* Recipient Sources Tabs */}
      <Tabs value={recipientSource} onValueChange={(value) => setRecipientSource(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="beneficiaries" disabled={messageType === 'internal'}>
            <Heart className="h-4 w-4 mr-1" />
            İhtiyaç Sahipleri
          </TabsTrigger>
          <TabsTrigger
            value="donors"
            disabled={messageType === 'internal' || messageType === 'email'}
          >
            <Users className="h-4 w-4 mr-1" />
            Bağışçılar
          </TabsTrigger>
          <TabsTrigger value="users" disabled={messageType !== 'internal'}>
            <User className="h-4 w-4 mr-1" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Upload className="h-4 w-4 mr-1" />
            Manuel
          </TabsTrigger>
        </TabsList>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-beneficiaries"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all-beneficiaries">Tümünü Seç ({recipients.length})</Label>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoadingBeneficiaries ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {messageType === 'internal'
                  ? 'Kurum içi mesajlar için ihtiyaç sahipleri kullanılamaz'
                  : 'Bu tür için uygun ihtiyaç sahibi bulunmuyor'}
              </div>
            ) : (
              recipients.map((recipient) => (
                <Card
                  key={recipient.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRecipients.includes(recipient.contact)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRecipientToggle(recipient.contact)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.contact)}
                        onChange={() => {
                          handleRecipientToggle(recipient.contact);
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          {getContactIcon()}
                          {messageType === 'sms'
                            ? formatPhoneNumber(recipient.contact)
                            : recipient.contact}
                        </div>
                        {recipient.city && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {recipient.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Donors Tab */}
        <TabsContent value="donors" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-donors"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all-donors">Tümünü Seç ({recipients.length})</Label>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoadingDonations ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {messageType === 'internal'
                  ? 'Kurum içi mesajlar için bağışçılar kullanılamaz'
                  : 'Bu tür için uygun bağışçı bulunmuyor'}
              </div>
            ) : (
              recipients.map((recipient) => (
                <Card
                  key={recipient.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRecipients.includes(recipient.contact)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRecipientToggle(recipient.contact)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.contact)}
                        onChange={() => {
                          handleRecipientToggle(recipient.contact);
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          {getContactIcon()}
                          {messageType === 'sms'
                            ? formatPhoneNumber(recipient.contact)
                            : recipient.contact}
                        </div>
                        {recipient.lastDonation && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Son bağış:{' '}
                            {new Date(recipient.lastDonation).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-users"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all-users">Tümünü Seç ({recipients.length})</Label>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoadingUsers ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {messageType !== 'internal'
                  ? 'Kullanıcılar sadece kurum içi mesajlar için kullanılabilir'
                  : 'Kullanıcı bulunmuyor'}
              </div>
            ) : (
              recipients.map((recipient) => (
                <Card
                  key={recipient.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRecipients.includes(recipient.contact)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRecipientToggle(recipient.contact)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.contact)}
                        onChange={() => {
                          handleRecipientToggle(recipient.contact);
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {recipient.email}
                        </div>
                        {recipient.role && (
                          <div className="text-sm text-gray-500">Rol: {recipient.role}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Custom Tab */}
        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-recipients">Manuel Giriş ({getContactLabel()})</Label>
            <Textarea
              id="custom-recipients"
              value={customRecipients}
              onChange={(e) => handleCustomRecipientsChange(e.target.value)}
              placeholder={`${getContactLabel()} adreslerini virgülle ayırarak girin`}
              rows={6}
            />
            <div className="text-sm text-gray-500">
              Örnek:{' '}
              {messageType === 'sms' ? '5551234567, 5559876543' : 'ornek@email.com, test@email.com'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleImportRecipients}
              className="hidden"
              id="import-recipients"
            />
            <Label htmlFor="import-recipients" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Dosyadan İçe Aktar
                </span>
              </Button>
            </Label>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Recipients */}
      {selectedRecipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Seçilen Alıcılar ({selectedRecipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedRecipients.slice(0, 10).map((recipient, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {messageType === 'sms' ? formatPhoneNumber(recipient) : recipient}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveRecipient(recipient)}
                  />
                </Badge>
              ))}
              {selectedRecipients.length > 10 && (
                <Badge variant="outline">+{selectedRecipients.length - 10} daha</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
