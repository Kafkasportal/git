// Corporate Login Form Component
// Premium Professional Design - Brand Consistent
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CorporateLoginFormProps {
  className?: string;
  showCorporateBranding?: boolean;
  redirectTo?: string;
}

export function CorporateLoginForm({
  className = '',
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

  const { login, isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
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
      }
      setMounted(true);
      initializeAuth();
    };

    if (!initRef.current) {
      initRef.current = true;
      init();
    }
  }, [initializeAuth]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [mounted, isAuthenticated, router, redirectTo]);

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
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      await login(email, password);
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          const rememberData = {
            email,
            timestamp: Date.now(),
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          };
          localStorage.setItem('rememberMe', JSON.stringify(rememberData));
        } else {
          localStorage.removeItem('rememberMe');
        }
      }
      toast.success('Başarıyla giriş yaptınız', {
        description: 'Yönlendiriliyorsunuz...',
        duration: 2000,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Giriş başarısız';
      toast.error('Giriş hatası', { description: errorMessage });
      emailInputRef.current?.focus();
      setIsLoading(false);
    }
  };

  if (!mounted || isAuthenticated) {
    return null;
  }

  return (
    <div className={cn(
      'min-h-screen w-full flex items-center justify-center relative overflow-hidden',
      'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[420px] z-10 px-4"
      >
        <div className="relative">
          {/* Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-2xl blur-lg opacity-20" />
          
          {/* Card Content */}
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
              >
                <Building2 className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white tracking-tight"
              >
                Dernek Yönetim Sistemi
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-400 text-sm mt-2"
              >
                Yönetim paneline giriş yapın
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                  E-posta Adresi
                </Label>
                <div className="relative">
                  <Mail className={cn(
                    'absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] transition-colors',
                    emailError ? 'text-red-400' : 'text-slate-500'
                  )} />
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="ornek@email.com"
                    className={cn(
                      'h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500',
                      'focus:bg-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
                      'rounded-lg transition-all',
                      emailError && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                    )}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-400 mt-1">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Şifre
                  </Label>
                  <button 
                    type="button"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Şifremi unuttum
                  </button>
                </div>
                <div className="relative">
                  <Lock className={cn(
                    'absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] transition-colors',
                    passwordError ? 'text-red-400' : 'text-slate-500'
                  )} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className={cn(
                      'h-11 pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500',
                      'focus:bg-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
                      'rounded-lg transition-all',
                      passwordError && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-400 mt-1">{passwordError}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(c === true)}
                  className="border-slate-600 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-slate-400 cursor-pointer select-none"
                >
                  Beni hatırla
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full h-11 font-semibold rounded-lg transition-all duration-200',
                  'bg-gradient-to-r from-indigo-500 to-violet-500',
                  'hover:from-indigo-600 hover:to-violet-600',
                  'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Giriş yapılıyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Giriş Yap
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} Dernek Yönetim Sistemi
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Güvenli bağlantı ile korunmaktadır
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
