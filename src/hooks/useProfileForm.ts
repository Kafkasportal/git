'use client';

import { useState, useCallback } from 'react';
import {
    EnhancedUserProfile,
    EmergencyContact,
    validatePassport,
    calculateAge,
    type BloodType,
    type CommunicationChannel,
} from '@/types/user-profile';

export interface ProfileFormState {
    name: string;
    birthDate: string;
    bloodType: string;
    nationality: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    passportNumber: string;
    passportIssueDate: string;
    passportExpiryDate: string;
    passportCountry: string;
    emergencyContacts: EmergencyContact[];
    commChannels: CommunicationChannel[];
    preferredLang: string;
    newsletter: boolean;
    smsNotif: boolean;
    emailNotif: boolean;
    contactTime: string;
}

export interface ProfileFormActions {
    setName: (value: string) => void;
    setBirthDate: (value: string) => void;
    setBloodType: (value: string) => void;
    setNationality: (value: string) => void;
    setPhone: (value: string) => void;
    setAddress: (value: string) => void;
    setCity: (value: string) => void;
    setDistrict: (value: string) => void;
    setPostalCode: (value: string) => void;
    setPassportNumber: (value: string) => void;
    setPassportIssueDate: (value: string) => void;
    setPassportExpiryDate: (value: string) => void;
    setPassportCountry: (value: string) => void;
    setPreferredLang: (value: string) => void;
    setNewsletter: (value: boolean) => void;
    setSmsNotif: (value: boolean) => void;
    setEmailNotif: (value: boolean) => void;
    setContactTime: (value: string) => void;
    addEmergencyContact: () => void;
    removeEmergencyContact: (index: number) => void;
    updateEmergencyContact: (index: number, field: keyof EmergencyContact, value: EmergencyContact[keyof EmergencyContact]) => void;
    setPrimaryContact: (index: number) => void;
    toggleCommunicationChannel: (channel: CommunicationChannel) => void;
}

export interface UseProfileFormReturn {
    state: ProfileFormState;
    actions: ProfileFormActions;
    hasChanges: boolean;
    setHasChanges: (value: boolean) => void;
    passportValidation: ReturnType<typeof validatePassport>;
    userAge: number | null;
    buildUpdates: () => Partial<EnhancedUserProfile>;
}

export function useProfileForm(user: EnhancedUserProfile): UseProfileFormReturn {
    const [hasChanges, setHasChanges] = useState(false);

    // Personal Info State
    const [name, setNameState] = useState(user.name);
    const [birthDate, setBirthDateState] = useState(user.birth_date || '');
    const [bloodType, setBloodTypeState] = useState(user.blood_type || '');
    const [nationality, setNationalityState] = useState(user.nationality || '');
    const [phone, setPhoneState] = useState(user.phone || '');

    // Address State
    const [address, setAddressState] = useState(user.address || '');
    const [city, setCityState] = useState(user.city || '');
    const [district, setDistrictState] = useState(user.district || '');
    const [postalCode, setPostalCodeState] = useState(user.postal_code || '');

    // Passport State
    const [passportNumber, setPassportNumberState] = useState(user.passport_number || '');
    const [passportIssueDate, setPassportIssueDateState] = useState(user.passport_issue_date || '');
    const [passportExpiryDate, setPassportExpiryDateState] = useState(user.passport_expiry_date || '');
    const [passportCountry, setPassportCountryState] = useState(user.passport_issuing_country || '');

    // Emergency Contacts State
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
        user.emergency_contacts || []
    );

    // Communication Preferences State
    const [commChannels, setCommChannels] = useState<CommunicationChannel[]>(
        user.communication_channels || []
    );
    const [preferredLang, setPreferredLangState] = useState(user.preferred_language || 'tr');
    const [newsletter, setNewsletterState] = useState(user.newsletter_subscription || false);
    const [smsNotif, setSmsNotifState] = useState<boolean>(user.sms_notifications || true);
    const [emailNotif, setEmailNotifState] = useState<boolean>(user.email_notifications || true);
    const [contactTime, setContactTimeState] = useState(user.best_contact_time || 'anytime');

    // Computed values
    const passportValidation = validatePassport({
        passport_number: passportNumber,
        passport_issue_date: passportIssueDate,
        passport_expiry_date: passportExpiryDate,
        passport_issuing_country: passportCountry,
    });

    const userAge = birthDate ? calculateAge(birthDate) : null;

    // Actions - memoized setters that track changes
    const setName = useCallback((value: string) => {
        setNameState(value);
        setHasChanges(true);
    }, []);

    const setBirthDate = useCallback((value: string) => {
        setBirthDateState(value);
        setHasChanges(true);
    }, []);

    const setBloodType = useCallback((value: string) => {
        setBloodTypeState(value);
        setHasChanges(true);
    }, []);

    const setNationality = useCallback((value: string) => {
        setNationalityState(value);
        setHasChanges(true);
    }, []);

    const setPhone = useCallback((value: string) => {
        setPhoneState(value);
        setHasChanges(true);
    }, []);

    const setAddress = useCallback((value: string) => {
        setAddressState(value);
        setHasChanges(true);
    }, []);

    const setCity = useCallback((value: string) => {
        setCityState(value);
        setHasChanges(true);
    }, []);

    const setDistrict = useCallback((value: string) => {
        setDistrictState(value);
        setHasChanges(true);
    }, []);

    const setPostalCode = useCallback((value: string) => {
        setPostalCodeState(value);
        setHasChanges(true);
    }, []);

    const setPassportNumber = useCallback((value: string) => {
        setPassportNumberState(value.toUpperCase());
        setHasChanges(true);
    }, []);

    const setPassportIssueDate = useCallback((value: string) => {
        setPassportIssueDateState(value);
        setHasChanges(true);
    }, []);

    const setPassportExpiryDate = useCallback((value: string) => {
        setPassportExpiryDateState(value);
        setHasChanges(true);
    }, []);

    const setPassportCountry = useCallback((value: string) => {
        setPassportCountryState(value);
        setHasChanges(true);
    }, []);

    const setPreferredLang = useCallback((value: string) => {
        setPreferredLangState(value);
        setHasChanges(true);
    }, []);

    const setNewsletter = useCallback((value: boolean) => {
        setNewsletterState(value);
        setHasChanges(true);
    }, []);

    const setSmsNotif = useCallback((value: boolean) => {
        setSmsNotifState(value);
        setHasChanges(true);
    }, []);

    const setEmailNotif = useCallback((value: boolean) => {
        setEmailNotifState(value);
        setHasChanges(true);
    }, []);

    const setContactTime = useCallback((value: string) => {
        setContactTimeState(value);
        setHasChanges(true);
    }, []);

    const addEmergencyContact = useCallback(() => {
        setEmergencyContacts((prev) => [
            ...prev,
            {
                name: '',
                relationship: '',
                phone: '',
                email: '',
                isPrimary: prev.length === 0,
            },
        ]);
        setHasChanges(true);
    }, []);

    const removeEmergencyContact = useCallback((index: number) => {
        setEmergencyContacts((prev) => prev.filter((_, i) => i !== index));
        setHasChanges(true);
    }, []);

    const updateEmergencyContact = useCallback(
        (index: number, field: keyof EmergencyContact, value: EmergencyContact[keyof EmergencyContact]) => {
            setEmergencyContacts((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [field]: value };
                return updated;
            });
            setHasChanges(true);
        },
        []
    );

    const setPrimaryContact = useCallback((index: number) => {
        setEmergencyContacts((prev) =>
            prev.map((contact, i) => ({
                ...contact,
                isPrimary: i === index,
            }))
        );
        setHasChanges(true);
    }, []);

    const toggleCommunicationChannel = useCallback((channel: CommunicationChannel) => {
        setCommChannels((prev) =>
            prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
        );
        setHasChanges(true);
    }, []);

    const buildUpdates = useCallback((): Partial<EnhancedUserProfile> => {
        return {
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
    }, [
        name,
        birthDate,
        bloodType,
        nationality,
        phone,
        address,
        city,
        district,
        postalCode,
        passportNumber,
        passportIssueDate,
        passportExpiryDate,
        passportCountry,
        emergencyContacts,
        commChannels,
        preferredLang,
        newsletter,
        smsNotif,
        emailNotif,
        contactTime,
    ]);

    return {
        state: {
            name,
            birthDate,
            bloodType,
            nationality,
            phone,
            address,
            city,
            district,
            postalCode,
            passportNumber,
            passportIssueDate,
            passportExpiryDate,
            passportCountry,
            emergencyContacts,
            commChannels,
            preferredLang,
            newsletter,
            smsNotif,
            emailNotif,
            contactTime,
        },
        actions: {
            setName,
            setBirthDate,
            setBloodType,
            setNationality,
            setPhone,
            setAddress,
            setCity,
            setDistrict,
            setPostalCode,
            setPassportNumber,
            setPassportIssueDate,
            setPassportExpiryDate,
            setPassportCountry,
            setPreferredLang,
            setNewsletter,
            setSmsNotif,
            setEmailNotif,
            setContactTime,
            addEmergencyContact,
            removeEmergencyContact,
            updateEmergencyContact,
            setPrimaryContact,
            toggleCommunicationChannel,
        },
        hasChanges,
        setHasChanges,
        passportValidation,
        userAge,
        buildUpdates,
    };
}
