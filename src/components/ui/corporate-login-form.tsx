// Corporate Login Form Component - Editorial/Luxury Design
// Sophisticated, Trustworthy, Memorable
'use client';

import { Shield, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCorporateLogin } from '@/hooks/useCorporateLogin';
import {
  LoginFormFields,
  TwoFactorField,
  LoginSubmitButton,
  OAuthSection,
} from './corporate-login-form-parts';

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
              <LoginFormFields
                email={email}
                password={password}
                showPassword={showPassword}
                rememberMe={rememberMe}
                emailError={emailError}
                passwordError={passwordError}
                focusedField={focusedField}
                emailInputRef={emailInputRef}
                onEmailChange={handleEmailChange}
                onPasswordChange={handlePasswordChange}
                onTogglePassword={() => setShowPassword(!showPassword)}
                onRememberMeChange={setRememberMe}
                onFocusField={setFocusedField}
              />

              {requiresTwoFactor && (
                <TwoFactorField
                  twoFactorCode={twoFactorCode}
                  twoFactorError={twoFactorError}
                  twoFactorInputRef={twoFactorInputRef}
                  onCodeChange={handleTwoFactorCodeChange}
                />
              )}

              <LoginSubmitButton isLoading={isLoading} requiresTwoFactor={requiresTwoFactor} />

              <OAuthSection redirectTo={redirectTo} />
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
