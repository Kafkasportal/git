// Corporate Login Form Component
// Ultra Modern Glassmorphism Design

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Shield, Building2, AlertCircle, ArrowRight, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [adminInfo, setAdminInfo] = useState<{ email: string; name: string; role: string } | null>(null);

  const initRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { login, isAuthenticated, initializeAuth } = useAuthStore();

  // Development mode - auto-fill credentials for easy testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  // Admin test credentials - always available for easy login
  const adminEmail = 'admin@kafkasder.com';
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_TEST_PASSWORD || 'Admin123!';
  const devEmail = 'mcp-login@example.com';
  const devPassword = 'SecurePass123!';

  // Fetch admin info on mount
  useEffect(() => {
    if (isDevelopment && !adminInfo) {
      fetch('/api/auth/admin-info')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setAdminInfo(data.data);
          }
        })
        .catch(() => {
          // Fallback to default if API fails
          setAdminInfo({
            email: adminEmail,
            name: 'Admin Kullanıcı',
            role: 'SUPER_ADMIN',
          });
        });
    }
  }, [isDevelopment, adminInfo]);

  // Handle hydration
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;

      // Development mode: auto-fill admin credentials for easy testing
      if (isDevelopment) {
        setEmail(adminEmail);
        setPassword(adminPassword);
        setMounted(true);
        return;
      }

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
  }, [isDevelopment]);

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

  // Quick admin login handler
  const handleQuickAdminLogin = async () => {
    setEmail(adminEmail);
    setPassword(adminPassword);
    setEmailError('');
    setPasswordError('');
    
    setIsLoading(true);
    try {
      await login(adminEmail, adminPassword);
      toast.success('Admin olarak giriş yaptınız', {
        description: 'Sisteme hoş geldiniz!',
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Giriş başarısız';
      toast.error('Giriş hatası', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until mounted
  if (!mounted || isAuthenticated) {
    return null;
  }

  // ... logic remains the same until return

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative ${className}`}
    >
      {/* Dynamic Background Elements - Ultra Modern Mesh Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-[#0f172a] z-0" />

        {/* Animated Mesh Gradients */}
        <motion.div
          animate={{
            opacity: [0.4, 0.6, 0.4],
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] blur-[100px] z-0"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-[120px] z-0"
        />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute top-[30%] left-[40%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)] blur-[100px] z-0"
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 z-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              initial={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.3 + 0.1,
              }}
              animate={{
                y: [null, Math.random() * -100],
                opacity: [null, 0],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
              }}
            />
          ))}
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] opacity-10 z-0" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 px-6"
      >
        {/* Glass Card */}
        <div className="relative group">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200" />

          <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl ring-1 ring-white/5">
            {/* Header Section */}
            <div className="text-center mb-10 space-y-3">
              {showCorporateBranding && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 shadow-lg shadow-blue-500/20 ring-4 ring-white/5"
                >
                  <Building2 className="w-10 h-10 text-white" />
                </motion.div>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white tracking-tight font-heading"
              >
                Hoş Geldiniz
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-400 text-lg font-body"
              >
                Yönetim paneline giriş yapın
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="email"
                  className="text-slate-200 text-xs uppercase tracking-wider font-bold ml-1 font-heading"
                >
                  Email Adresi
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors duration-300" />
                  </div>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="ornek@sirket.com"
                    className={cn(
                      'pl-11 h-14 bg-slate-950/50 border-slate-600/60 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-slate-900/80 transition-all duration-300 rounded-xl font-body text-base shadow-inner',
                      emailError &&
                        'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10'
                    )}
                  />
                  {emailError && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-xs text-red-400 ml-1 font-medium animate-in slide-in-from-left-1">
                    {emailError}
                  </p>
                )}
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="password"
                  className="text-slate-200 text-xs uppercase tracking-wider font-bold ml-1 font-heading"
                >
                  Şifre
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors duration-300" />
                  </div>
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className={cn(
                      'pl-11 pr-12 h-14 bg-slate-950/50 border-slate-600/60 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-slate-900/80 transition-all duration-300 rounded-xl font-body text-base shadow-inner',
                      passwordError &&
                        'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-400 ml-1 font-medium animate-in slide-in-from-left-1">
                    {passwordError}
                  </p>
                )}
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-[4px]"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-slate-300 cursor-pointer hover:text-white transition-colors font-body font-medium"
                  >
                    Beni hatırla
                  </Label>
                </div>
                <a
                  href="#"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium font-body hover:underline underline-offset-4"
                >
                  Şifremi unuttum?
                </a>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 font-heading"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Giriş yapılıyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Admin Test Login Info - Always Visible */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm"
            >
                  <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                      Admin Test Giriş
                    </p>
                    <Button
                      type="button"
                      onClick={handleQuickAdminLogin}
                      disabled={isLoading}
                      size="sm"
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white border-0"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Hızlı Giriş
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-200">{adminInfo?.email || adminEmail}</span>
                    </div>
                    {adminInfo?.name && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="h-3 w-3" />
                        <span className="text-slate-300">{adminInfo.name}</span>
                        <span className="text-slate-500">({adminInfo.role})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-200">••••••••</span>
                      <span className="text-slate-400 text-[10px]">(Test şifresi)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    💡 Test için admin bilgileri otomatik doldurulur. "Hızlı Giriş" butonuna tıklayarak tek tıkla giriş yapabilirsiniz.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 pt-6 border-t border-white/10 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-body">
                <Shield className="h-4 w-4" />
                <span>256-bit SSL ile güvenli bağlantı</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-slate-500 text-sm mt-8 font-body"
        >
          &copy; {new Date().getFullYear()} Kafkasder. Tüm hakları saklıdır.
        </motion.p>
      </motion.div>
    </div>
  );
}
