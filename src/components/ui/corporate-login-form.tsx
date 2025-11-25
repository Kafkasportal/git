// Corporate Login Form Component
// Professional, clean design with better UX

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Shield, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OAuthButton } from '@/components/auth/OAuthButton';

interface CorporateLoginFormProps {
  className?: string;
  showCorporateBranding?: boolean;
  redirectTo?: string;
}

export function CorporateLoginForm({
  className = '',
  showCorporateBranding = true,
  redirectTo = '/genel',
}: CorporateLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { login, isAuthenticated, initializeAuth } = useAuthStore();

  // Handle hydration
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;

      // Load remember me data
      const rememberData = localStorage.getItem('rememberMe');
      if (rememberData) {
        try {
          const parsed = JSON.parse(rememberData);
          if (parsed.expires > Date.now()) {
            setEmail(parsed.email);
            setRememberMe(true);
          } else {
            localStorage.removeItem('rememberMe');
          }
        } catch {
          localStorage.removeItem('rememberMe');
        }
      }

      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (mounted && initRef.current) {
      initializeAuth();
    }
  }, [mounted, initializeAuth]);

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [mounted, isAuthenticated, router, redirectTo]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email adresi gereklidir');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Geçerli bir email adresi girin');
      return false;
    }
    setEmailError('');
    return true;
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const feedback: string[] = [];

    if (password.length >= 8) strength += 1;
    else feedback.push('En az 8 karakter');

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('Büyük harf');

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('Küçük harf');

    if (/\d/.test(password)) strength += 1;
    else feedback.push('Rakam');

    if (/[^A-Za-z\d]/.test(password)) strength += 1;
    else feedback.push('Özel karakter');

    return {
      strength,
      feedback,
      level: strength <= 2 ? 'weak' : strength <= 3 ? 'medium' : 'strong',
    };
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Şifre gereklidir');
      return false;
    }
    if (password.length < 6) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);

      // Remember me functionality
      if (rememberMe) {
        const rememberData = {
          email,
          timestamp: Date.now(),
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };
        localStorage.setItem('rememberMe', JSON.stringify(rememberData));
      } else {
        localStorage.removeItem('rememberMe');
      }

      toast.success('Başarıyla giriş yaptınız', {
        description: 'Sisteme hoş geldiniz!',
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Giriş başarısız';

      toast.error('Giriş hatası', {
        description: errorMessage,
      });

      // Focus on the email field if there's an error
      emailInputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, nextField?: () => void) => {
    if (e.key === 'Enter' && nextField) {
      e.preventDefault();
      nextField();
    }
  };

  // Don't render until mounted
  if (!mounted || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-slate-500"
            >
              Yükleniyor...
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 ${className}`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-100 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Corporate Branding */}
        {showCorporateBranding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dernek Yönetim Sistemi</h1>
            <p className="text-slate-600">Profesyonel yönetim platformu</p>
          </motion.div>
        )}

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-slate-900">
              Hesabınıza Giriş Yapın
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Güvenli giriş için bilgilerinizi girin
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              data-testid="login-form"
              aria-live="polite"
            >
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Adresi
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyPress={(e) => handleKeyPress(e, () => passwordInputRef.current?.focus())}
                    placeholder="ornek@sirket.com"
                    className={cn(
                      'pl-10 h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20',
                      emailError && 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    data-testid="login-email"
                  />
                  <AnimatePresence>
                    {emailError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-600 flex items-center gap-1"
                      role="alert"
                      id="email-error"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Şifre
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                    placeholder="••••••••"
                    className={cn(
                      'pl-10 pr-10 h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20',
                      passwordError && 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    required
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <AnimatePresence>
                  {password && !passwordError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const strength = getPasswordStrength(password);
                          return (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < strength.strength
                                  ? strength.level === 'weak'
                                    ? 'bg-red-500'
                                    : strength.level === 'medium'
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p
                        className={`text-xs ${
                          getPasswordStrength(password).level === 'weak'
                            ? 'text-red-600'
                            : getPasswordStrength(password).level === 'medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                        data-testid="password-strength-label"
                      >
                        {getPasswordStrength(password).level === 'weak'
                          ? 'Zayıf şifre'
                          : getPasswordStrength(password).level === 'medium'
                            ? 'Orta seviye şifre'
                            : 'Güçlü şifre'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-600 flex items-center gap-1"
                      role="alert"
                      id="password-error"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {passwordError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Remember Me */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => {
                    setRememberMe(checked === true);
                  }}
                  disabled={isLoading}
                  data-testid="login-remember"
                />
                <Label htmlFor="remember" className="text-sm text-slate-700 cursor-pointer">
                  Beni hatırla (7 gün)
                </Label>
              </motion.div>

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <Shield className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Bilgileriniz 256-bit SSL şifreleme ile korunmaktadır
                </p>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  data-testid="login-submit"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Giriş Yap
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </motion.div>

              {/* OAuth Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.55 }}
                className="relative mt-6"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">veya</span>
                </div>
              </motion.div>

              {/* OAuth Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="space-y-2 mt-4"
              >
                <OAuthButton
                  provider="google"
                  redirectUrl={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}
                  className="w-full"
                  variant="outline"
                />
                <OAuthButton
                  provider="github"
                  redirectUrl={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}
                  className="w-full"
                  variant="outline"
                />
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="mt-6 pt-6 border-t border-slate-200 text-center"
            >
              <p className="text-sm text-slate-600">
                Destek için:
                <span className="text-blue-600 font-medium ml-1">destek@dernek.com</span>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
