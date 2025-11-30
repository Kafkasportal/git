'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ripple';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullscreen?: boolean;
  blur?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  fullscreen = false,
  blur = true,
  className,
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'sm':
        return 32;
      case 'md':
        return 48;
      case 'lg':
        return 64;
      default:
        return 48;
    }
  };

  const sizeValue = getSizeValue();

  const renderAnimation = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className="rounded-full border-4 border-transparent border-t-brand-primary animate-spin motion-reduce:animate-none"
            style={{ width: sizeValue, height: sizeValue }}
          />
        );

      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-3 h-3 bg-brand-primary rounded-full animate-bounce-dot motion-reduce:animate-none"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="relative" style={{ width: sizeValue, height: sizeValue }}>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="absolute inset-0 rounded-full border-2 border-brand-primary animate-ripple motion-reduce:animate-none"
                style={{
                  animationDelay: `${index * 0.5}s`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-brand-primary rounded-full animate-pulse-ring motion-reduce:animate-none" />
            </div>
          </div>
        );

      case 'bars':
        return (
          <div className="flex items-end space-x-1.5" style={{ height: sizeValue }}>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-2 bg-brand-primary rounded-full animate-bar-bounce motion-reduce:animate-none"
                style={{
                  animationDelay: `${index * 0.15}s`,
                }}
              />
            ))}
          </div>
        );

      case 'ripple':
        return (
          <div className="relative" style={{ width: sizeValue, height: sizeValue }}>
            {[0, 1].map((index) => (
              <div
                key={index}
                className="absolute inset-0 rounded-full border-4 border-brand-primary animate-ripple motion-reduce:animate-none"
                style={{
                  animationDelay: `${index * 0.75}s`,
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={cn(
          'flex flex-col items-center justify-center z-50',
          fullscreen ? 'fixed inset-0' : 'absolute inset-0',
          blur && 'bg-background/80 backdrop-blur-sm',
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Yükleniyor...</span>
        {renderAnimation()}
        {text && (
          <p className="mt-4 font-body text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
