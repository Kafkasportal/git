import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface UseCorporateLoginOptions {
  redirectTo?: string;
}

export function useCorporateLogin({ redirectTo = '/genel' }: UseCorporateLoginOptions = {}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const initRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const twoFactorInputRef = useRef<HTMLInputElement>(null);

  const { login, isAuthenticated, initializeAuth } = useAuthStore();

  const loadRememberedEmail = () => {
    if (globalThis.window === undefined) return;

    const rememberData = localStorage.getItem('rememberMe');
    if (!rememberData) return;

    try {
      const parsed = JSON.parse(rememberData);
      if (parsed?.expires > Date.now()) {
        setEmail(parsed.email);
        setRememberMe(true);
      } else {
        localStorage.removeItem('rememberMe');
      }
    } catch {
      localStorage.removeItem('rememberMe');
    }
  };

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadRememberedEmail();
      setMounted(true);
      initializeAuth();
    }
  }, [initializeAuth]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [mounted, isAuthenticated, router, redirectTo]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('Email adresi gereklidir');
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Geçerli bir email adresi girin');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (passwordValue: string): boolean => {
    if (!passwordValue) {
      setPasswordError('Şifre gereklidir');
      return false;
    }
    if (passwordValue.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) validatePassword(value);
  };

  const saveRememberMe = (shouldRemember: boolean) => {
    if (globalThis.window === undefined) return;

    if (shouldRemember) {
      const rememberData = {
        email,
        timestamp: Date.now(),
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('rememberMe', JSON.stringify(rememberData));
    } else {
      localStorage.removeItem('rememberMe');
    }
  };

  const handleLoginSuccess = async () => {
    setIsLoading(false);
    toast.success('Başarıyla giriş yaptınız', {
      description: 'Yönlendiriliyorsunuz...',
      duration: 2000,
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push(redirectTo);
  };

  const getErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return defaultMessage;
  };

  const handleTwoFactorSubmit = async () => {
    if (twoFactorCode?.length !== 6) {
      setTwoFactorError('2FA kodu 6 haneli olmalıdır');
      twoFactorInputRef.current?.focus();
      return;
    }

    setTwoFactorError('');
    setIsLoading(true);

    try {
      await login(email, password, rememberMe, twoFactorCode);
      saveRememberMe(rememberMe);
      await handleLoginSuccess();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, '2FA kodu hatalı');
      setTwoFactorError(errorMessage);
      twoFactorInputRef.current?.focus();
      setIsLoading(false);
    }
  };

  const handleTwoFactorError = () => {
    setRequiresTwoFactor(true);
    setIsLoading(false);
    setTimeout(() => {
      twoFactorInputRef.current?.focus();
    }, 100);
    toast.info('2FA kodu gereklidir', {
      description: 'Lütfen authenticator uygulamanızdan kodu girin',
    });
  };

  const handleLoginError = (err: unknown) => {
    const errorMessage = getErrorMessage(err, 'Giriş başarısız');
    toast.error('Giriş hatası', { description: errorMessage });
    emailInputRef.current?.focus();
    setIsLoading(false);
  };

  const handleRegularLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      saveRememberMe(rememberMe);
      await handleLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error & { requiresTwoFactor?: boolean };

      if (error.requiresTwoFactor) {
        handleTwoFactorError();
      } else {
        handleLoginError(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiresTwoFactor) {
      await handleTwoFactorSubmit();
      return;
    }

    await handleRegularLogin();
  };

  const handleTwoFactorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(/\D/g, '').slice(0, 6);
    setTwoFactorCode(value);
    if (twoFactorError) {
      setTwoFactorError('');
    }
  };

  return {
    // State
    email,
    password,
    showPassword,
    rememberMe,
    emailError,
    passwordError,
    isLoading,
    requiresTwoFactor,
    twoFactorCode,
    twoFactorError,
    focusedField,
    isAuthenticated,
    // Refs
    emailInputRef,
    twoFactorInputRef,
    // Setters
    setPassword,
    setShowPassword,
    setRememberMe,
    setTwoFactorCode,
    setFocusedField,
    // Handlers
    handleEmailChange,
    handlePasswordChange,
    handleTwoFactorCodeChange,
    handleSubmit,
  };
}
