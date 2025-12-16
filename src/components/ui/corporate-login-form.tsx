// Corporate Login Form Component - Editorial/Luxury Design
// Sophisticated, Trustworthy, Memorable
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { useCorporateLogin } from '@/hooks/useCorporateLogin';

interface CorporateLoginFormProps {
  readonly className?: string;
  readonly redirectTo?: string;
}

const GeometricPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.07]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="currentColor" strokeWidth="1" className="text-teal-400" />
      </pattern>
      <pattern id="grid-dots" patternUnits="userSpaceOnUse" width="60" height="60">
        <circle cx="30" cy="30" r="1" fill="currentColor" className="text-teal-400" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
    <rect width="100%" height="100%" fill="url(#grid-dots)" />
  </svg>
);

const DecorativeTriangles = () => (
  <>
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 0.1, x: 0 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="absolute top-20 left-10"
    >
      <div className="w-0 h-0 border-l-[60px] border-l-transparent border-b-[100px] border-b-teal-400 border-r-[60px] border-r-transparent" />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 0.08, y: 0 }}
      transition={{ delay: 0.7, duration: 1 }}
      className="absolute bottom-32 right-16"
    >
      <div className="w-0 h-0 border-l-[40px] border-l-transparent border-t-[70px] border-t-teal-300 border-r-[40px] border-r-transparent" />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.06, scale: 1 }}
      transition={{ delay: 0.9, duration: 1 }}
      className="absolute top-1/2 right-8"
    >
      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-b-[50px] border-b-white border-r-[30px] border-r-transparent" />
    </motion.div>
  </>
);

const KafkasderLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M32 4L58 18V46L32 60L6 46V18L32 4Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M32 4V60M6 18L58 46M58 18L6 46"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.5"
    />
    <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2" />
    <path d="M32 20V44" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 32H44" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const trustBadges = [
  { icon: Shield, title: 'Güvenli Bağlantı', desc: '256-bit SSL şifreleme' },
  { icon: CheckCircle2, title: 'İki Faktörlü Doğrulama', desc: 'Gelişmiş hesap koruması' },
  { icon: Lock, title: 'KVKK Uyumlu', desc: 'Kişisel veri güvencesi' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function CorporateLoginForm({
  className = '',
  redirectTo = '/genel',
}: CorporateLoginFormProps) {
  const {
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
    emailInputRef,
    twoFactorInputRef,
    setShowPassword,
    setRememberMe,
    setFocusedField,
    handleEmailChange,
    handlePasswordChange,
    handleTwoFactorCodeChange,
    handleSubmit,
  } = useCorporateLogin({ redirectTo });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={cn('min-h-screen w-full flex', className)}>
      {/* Left Panel - Brand Story (Hidden on Mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
        }}
      >
        <GeometricPattern />
        <DecorativeTriangles />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
                className="w-14 h-14 text-teal-400"
              >
                <KafkasderLogo className="w-full h-full" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  KAFKASDER
                </h1>
                <p className="text-slate-400 text-sm tracking-wide">Yönetim Sistemi</p>
              </div>
            </div>
          </motion.div>

          {/* Brand Story */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h2
                className="text-4xl xl:text-5xl font-light text-white leading-tight mb-6"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Topluluk için{' '}
                <span className="block font-semibold text-teal-400">
                  birlikte yönetim.
                </span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Dernek yönetimini dijitalleştiren, şeffaflık ve verimlilik odaklı profesyonel platform.
              </p>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {trustBadges.map((badge) => (
                <motion.div
                  key={badge.title}
                  variants={itemVariants}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors duration-300">
                    <badge.icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {badge.title}
                    </p>
                    <p className="text-slate-500 text-xs">{badge.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-slate-600 text-xs"
          >
            © {new Date().getFullYear()} KAFKASDER. Tüm hakları saklıdır.
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Mobile Header with Pattern */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden relative h-32 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
          }}
        >
          <GeometricPattern />
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <KafkasderLogo className="w-10 h-10 text-teal-400" />
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  KAFKASDER
                </h1>
                <p className="text-slate-400 text-xs">Yönetim Sistemi</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 xl:px-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md"
          >
            {/* Form Header */}
            <div className="mb-10">
              <h2
                className="text-3xl font-semibold text-slate-900 mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Hoş Geldiniz
              </h2>
              <p className="text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Hesabınıza giriş yapın
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn(
                    'text-sm font-medium transition-colors duration-200',
                    focusedField === 'email' ? 'text-teal-600' : 'text-slate-700'
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  E-posta Adresi
                </Label>
                <div className="relative group">
                  <Mail
                    className={cn(
                      'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300',
                      focusedField === 'email' ? 'text-teal-500 scale-110' : 'text-slate-400',
                      emailError && 'text-red-500'
                    )}
                  />
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="ornek@email.com"
                    className={cn(
                      'h-14 pl-12 pr-4 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400',
                      'rounded-xl transition-all duration-300',
                      'focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:shadow-lg focus:shadow-teal-500/10',
                      'hover:border-slate-300 hover:bg-white',
                      emailError && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="text-sm text-red-500 font-medium pl-1"
                  >
                    {emailError}
                  </motion.p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className={cn(
                      'text-sm font-medium transition-colors duration-200',
                      focusedField === 'password' ? 'text-teal-600' : 'text-slate-700'
                    )}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Şifre
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors hover:underline underline-offset-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Şifremi unuttum?
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className={cn(
                      'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300',
                      focusedField === 'password' ? 'text-teal-500 scale-110' : 'text-slate-400',
                      passwordError && 'text-red-500'
                    )}
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={cn(
                      'h-14 pl-12 pr-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400',
                      'rounded-xl transition-all duration-300',
                      'focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:shadow-lg focus:shadow-teal-500/10',
                      'hover:border-slate-300 hover:bg-white',
                      passwordError && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className="text-sm text-red-500 font-medium pl-1"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </motion.div>

              {/* 2FA Code Field */}
              {requiresTwoFactor && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  transition={{ duration: 0.4 }}
                  className="space-y-2 p-5 bg-teal-50 border border-teal-200 rounded-xl"
                >
                  <Label
                    htmlFor="twoFactorCode"
                    className="text-sm font-medium text-teal-800"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    İki Faktörlü Doğrulama Kodu
                  </Label>
                  <Input
                    ref={twoFactorInputRef}
                    id="twoFactorCode"
                    type="text"
                    value={twoFactorCode}
                    onChange={handleTwoFactorCodeChange}
                    placeholder="000000"
                    maxLength={6}
                    className={cn(
                      'h-14 bg-white border-teal-200 text-slate-900 placeholder:text-slate-400',
                      'rounded-xl transition-all text-center text-xl tracking-[0.5em] font-semibold',
                      'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20',
                      twoFactorError && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  {twoFactorError && (
                    <p className="text-sm text-red-500 font-medium">{twoFactorError}</p>
                  )}
                  <p className="text-xs text-teal-700 mt-2">
                    Authenticator uygulamanızdan 6 haneli kodu girin
                  </p>
                </motion.div>
              )}

              {/* Remember Me */}
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(c === true)}
                  className="w-5 h-5 rounded border-slate-300 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 transition-colors"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-slate-600 cursor-pointer select-none font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Beni hatırla
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full h-14 font-semibold rounded-xl transition-all duration-300',
                    'bg-gradient-to-r from-teal-500 to-teal-600',
                    'hover:from-teal-600 hover:to-teal-700 hover:shadow-xl hover:shadow-teal-500/25',
                    'active:scale-[0.98]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
                    'focus:ring-4 focus:ring-teal-500/30'
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {isLoading ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {requiresTwoFactor ? 'Doğrulanıyor...' : 'Giriş yapılıyor...'}
                    </motion.span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {requiresTwoFactor ? 'Doğrula' : 'Giriş Yap'}
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* OAuth Divider */}
              <motion.div variants={itemVariants} className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="bg-white px-4 text-sm text-slate-400 font-medium"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    veya şununla devam edin
                  </span>
                </div>
              </motion.div>

              {/* OAuth Buttons */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                <OAuthButton
                  provider="google"
                  redirectUrl={redirectTo}
                  variant="outline"
                  className="h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-teal-300 rounded-xl transition-all duration-300 hover:shadow-md"
                />
                <OAuthButton
                  provider="github"
                  redirectUrl={redirectTo}
                  variant="outline"
                  className="h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-teal-300 rounded-xl transition-all duration-300 hover:shadow-md"
                />
                <OAuthButton
                  provider="microsoft"
                  redirectUrl={redirectTo}
                  variant="outline"
                  className="h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-teal-300 rounded-xl transition-all duration-300 hover:shadow-md"
                />
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div variants={itemVariants} className="mt-10 text-center">
              <p className="text-sm text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Hesabınız yok mu?{' '}
                <a href="/kayit" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline underline-offset-2">
                  Kayıt olun
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden lg:block px-12 py-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            Giriş yaparak{' '}
            <a href="/kullanim-sartlari" className="text-teal-600 hover:underline">
              Kullanım Şartları
            </a>
            {' ve '}
            <a href="/gizlilik-politikasi" className="text-teal-600 hover:underline">
              Gizlilik Politikası
            </a>
            {' '}&apos;nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
}
