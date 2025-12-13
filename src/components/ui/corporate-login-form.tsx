// Corporate Login Form Component
// Premium Glassmorphism Design
// "From Scratch" Redesign

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CorporateLoginFormProps {
  className?: string;
  showCorporateBranding?: boolean;
  redirectTo?: string;
}

export function CorporateLoginForm({
  className = '',
  // showCorporateBranding is not used in the new design
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
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

  const initRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { login, isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Only run once on mount
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
      // Small delay to show success state
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
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 ${className}`}>
      
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s' }} />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.1 }} />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        {/* Glass Card */}
        <div className="relative group">
          {/* Card Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-2xl shadow-2xl">
            
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white tracking-tight mb-2"
              >
                KAFKASDER
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-sm"
              >
                Yönetim Paneli Girişi
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">
                  Email
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors duration-200 ${emailError ? 'text-red-400' : 'text-slate-500 group-focus-within/input:text-emerald-400'}`} />
                  </div>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="ornek@mail.com"
                    className={cn(
                      "pl-11 h-12 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:bg-slate-950/80 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl transition-all",
                      emailError && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    )}
                  />
                  <AnimatePresence>
                    {emailError && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute right-0 top-0 bottom-0 pr-4 flex items-center pointer-events-none"
                      >
                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-md border border-red-400/20">
                          !
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {emailError && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-red-400 ml-1"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">
                    Şifre
                  </Label>
                  <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    Unuttunuz mu?
                  </a>
                </div>
                
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors duration-200 ${passwordError ? 'text-red-400' : 'text-slate-500 group-focus-within/input:text-emerald-400'}`} />
                  </div>
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className={cn(
                      "pl-11 pr-11 h-12 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:bg-slate-950/80 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl transition-all",
                      passwordError && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-red-400 ml-1"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(c === true)}
                  className="border-slate-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-400 cursor-pointer select-none"
                >
                  Beni hatırla
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                onMouseEnter={() => setIsHoveringSubmit(true)}
                onMouseLeave={() => setIsHoveringSubmit(false)}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-900/20 border border-emerald-500/20 relative overflow-hidden"
              >
                {/* Button Shine Effect */}
                <div className={`absolute inset-0 bg-white/20 skew-x-12 transition-transform duration-700 ${isHoveringSubmit ? 'translate-x-full' : '-translate-x-full'}`} />
                
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Giriş Yap</span>
                    <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHoveringSubmit ? 'translate-x-1' : ''}`} />
                  </div>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} Kafkasder Yönetim Sistemi.
                <br />
                Güvenli ve Modern Altyapı
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
