'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OAuthButton } from '@/components/auth/OAuthButton';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

interface LoginFormFieldsProps {
  readonly email: string;
  readonly password: string;
  readonly showPassword: boolean;
  readonly rememberMe: boolean;
  readonly emailError: string;
  readonly passwordError: string;
  readonly focusedField: string | null;
  readonly emailInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onTogglePassword: () => void;
  readonly onRememberMeChange: (checked: boolean) => void;
  readonly onFocusField: (field: string | null) => void;
}

export function LoginFormFields({
  email,
  password,
  showPassword,
  rememberMe,
  emailError,
  passwordError,
  focusedField,
  emailInputRef,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRememberMeChange,
  onFocusField,
}: LoginFormFieldsProps) {
  return (
    <>
      {/* Email Field */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label
          htmlFor="email"
          className={cn(
            'mb-1.5 text-sm font-medium transition-colors duration-200',
            focusedField === 'email' ? 'text-primary-600' : 'text-slate-700'
          )}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          E-posta Adresi
        </Label>
        <div className="relative group">
          <Mail
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300',
              focusedField === 'email' ? 'text-primary-500 scale-110' : 'text-slate-400',
              emailError && 'text-red-500'
            )}
          />
          <Input
            ref={emailInputRef}
            id="email"
            type="email"
            value={email}
            onChange={onEmailChange}
            onFocus={() => onFocusField('email')}
            onBlur={() => onFocusField(null)}
            placeholder="ornek@email.com"
            className={cn(
              'h-14 pl-12 pr-4 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400',
              'rounded-xl transition-all duration-300',
              'focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:shadow-lg focus:shadow-primary-500/10',
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
              'mb-1.5 text-sm font-medium transition-colors duration-200',
              focusedField === 'password' ? 'text-primary-600' : 'text-slate-700'
            )}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Şifre
          </Label>
          <button
            type="button"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline underline-offset-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Şifremi unuttum?
          </button>
        </div>
        <div className="relative group">
          <Lock
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300',
              focusedField === 'password' ? 'text-primary-500 scale-110' : 'text-slate-400',
              passwordError && 'text-red-500'
            )}
          />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={onPasswordChange}
            onFocus={() => onFocusField('password')}
            onBlur={() => onFocusField(null)}
            placeholder="••••••••"
            className={cn(
              'h-14 pl-12 pr-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400',
              'rounded-xl transition-all duration-300',
              'focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:shadow-lg focus:shadow-primary-500/10',
              'hover:border-slate-300 hover:bg-white',
              passwordError && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            )}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            type="button"
            onClick={onTogglePassword}
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

      {/* Remember Me */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(c) => onRememberMeChange(c === true)}
          className="w-5 h-5 rounded border-slate-300 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500 transition-colors"
        />
        <label
          htmlFor="remember"
          className="text-sm text-slate-600 cursor-pointer select-none font-medium"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Beni hatırla
        </label>
      </motion.div>
    </>
  );
}

interface TwoFactorFieldProps {
  readonly twoFactorCode: string;
  readonly twoFactorError: string;
  readonly twoFactorInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TwoFactorField({
  twoFactorCode,
  twoFactorError,
  twoFactorInputRef,
  onCodeChange,
}: TwoFactorFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.4 }}
      className="space-y-2 p-5 bg-primary-50 border border-primary-200 rounded-xl"
    >
      <Label
        htmlFor="twoFactorCode"
        className="text-sm font-medium text-primary-800"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        İki Faktörlü Doğrulama Kodu
      </Label>
      <Input
        ref={twoFactorInputRef}
        id="twoFactorCode"
        type="text"
        value={twoFactorCode}
        onChange={onCodeChange}
        placeholder="000000"
        maxLength={6}
        className={cn(
          'h-14 bg-white border-primary-200 text-slate-900 placeholder:text-slate-400',
          'rounded-xl transition-all text-center text-xl tracking-[0.5em] font-semibold',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          twoFactorError && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
        )}
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
      {twoFactorError && (
        <p className="text-sm text-red-500 font-medium">{twoFactorError}</p>
      )}
      <p className="text-xs text-primary-700 mt-2">
        Authenticator uygulamanızdan 6 haneli kodu girin
      </p>
    </motion.div>
  );
}

interface LoginSubmitButtonProps {
  readonly isLoading: boolean;
  readonly requiresTwoFactor: boolean;
}

export function LoginSubmitButton({ isLoading, requiresTwoFactor }: LoginSubmitButtonProps) {
  return (
    <motion.div variants={itemVariants}>
      <Button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full h-14 font-semibold rounded-xl transition-all duration-300',
          'bg-gradient-to-r from-primary-500 to-primary-600',
          'hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:shadow-primary-500/25',
          'active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          'focus:ring-4 focus:ring-primary-500/30'
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
  );
}

interface OAuthSectionProps {
  readonly redirectTo: string;
}

export function OAuthSection({ redirectTo }: OAuthSectionProps) {
  return (
    <>
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
          className="h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary-300 rounded-xl transition-all duration-300 hover:shadow-md"
        />
        <OAuthButton
          provider="github"
          redirectUrl={redirectTo}
          variant="outline"
          className="h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary-300 rounded-xl transition-all duration-300 hover:shadow-md"
        />
        <OAuthButton
          provider="microsoft"
          redirectUrl={redirectTo}
          variant="outline"
          className="h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary-300 rounded-xl transition-all duration-300 hover:shadow-md"
        />
      </motion.div>
    </>
  );
}
