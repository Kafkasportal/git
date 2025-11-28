'use client';

import { toast as sonnerToast, Toaster } from 'sonner';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface EnhancedToastOptions {
  title?: string;
  description?: ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  close?: boolean;
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />;
    default:
      return null;
  }
};

const getBackgroundColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-amber-50 border-amber-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-white border-slate-200';
  }
};

const getTextColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'text-green-900';
    case 'error':
      return 'text-red-900';
    case 'warning':
      return 'text-amber-900';
    case 'info':
      return 'text-blue-900';
    default:
      return 'text-slate-900';
  }
};

export const enhancedToast = {
  success: (message: string | EnhancedToastOptions) => {
    if (typeof message === 'string') {
      return sonnerToast.success(message, {
        duration: 3000,
      });
    }

    return sonnerToast.custom(
      (id) => (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${getBackgroundColor('success')}`}
          role="alert"
          aria-live="polite"
        >
          {getIcon('success')}
          <div className="flex-1 min-w-0">
            {message.title && (
              <h3 className={`font-semibold text-sm ${getTextColor('success')}`}>
                {message.title}
              </h3>
            )}
            {message.description && (
              <p className={`text-sm ${getTextColor('success')} mt-1 opacity-90`}>
                {message.description}
              </p>
            )}
          </div>
          {message.action && (
            <button
              onClick={() => {
                message.action?.onClick();
                sonnerToast.dismiss(id);
              }}
              className="text-sm font-medium text-green-600 hover:text-green-700 whitespace-nowrap"
            >
              {message.action.label}
            </button>
          )}
        </div>
      ),
      {
        duration: message.duration || 3000,
      }
    );
  },

  error: (message: string | EnhancedToastOptions) => {
    if (typeof message === 'string') {
      return sonnerToast.error(message, {
        duration: 4000,
      });
    }

    return sonnerToast.custom(
      (id) => (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${getBackgroundColor('error')}`}
          role="alert"
          aria-live="polite"
        >
          {getIcon('error')}
          <div className="flex-1 min-w-0">
            {message.title && (
              <h3 className={`font-semibold text-sm ${getTextColor('error')}`}>{message.title}</h3>
            )}
            {message.description && (
              <p className={`text-sm ${getTextColor('error')} mt-1 opacity-90`}>
                {message.description}
              </p>
            )}
          </div>
          {message.action && (
            <button
              onClick={() => {
                message.action!.onClick();
                sonnerToast.dismiss(id);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 whitespace-nowrap"
            >
              {message.action.label}
            </button>
          )}
        </div>
      ),
      {
        duration: message.duration || 4000,
      }
    );
  },

  warning: (message: string | EnhancedToastOptions) => {
    if (typeof message === 'string') {
      return sonnerToast.warning(message, {
        duration: 3500,
      });
    }

    return sonnerToast.custom(
      (id) => (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${getBackgroundColor('warning')}`}
          role="alert"
          aria-live="polite"
        >
          {getIcon('warning')}
          <div className="flex-1 min-w-0">
            {message.title && (
              <h3 className={`font-semibold text-sm ${getTextColor('warning')}`}>
                {message.title}
              </h3>
            )}
            {message.description && (
              <p className={`text-sm ${getTextColor('warning')} mt-1 opacity-90`}>
                {message.description}
              </p>
            )}
          </div>
          {message.action && (
            <button
              onClick={() => {
                message.action!.onClick();
                sonnerToast.dismiss(id);
              }}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 whitespace-nowrap"
            >
              {message.action.label}
            </button>
          )}
        </div>
      ),
      {
        duration: message.duration || 3500,
      }
    );
  },

  info: (message: string | EnhancedToastOptions) => {
    if (typeof message === 'string') {
      return sonnerToast.info(message, {
        duration: 3000,
      });
    }

    return sonnerToast.custom(
      (id) => (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${getBackgroundColor('info')}`}
          role="alert"
          aria-live="polite"
        >
          {getIcon('info')}
          <div className="flex-1 min-w-0">
            {message.title && (
              <h3 className={`font-semibold text-sm ${getTextColor('info')}`}>{message.title}</h3>
            )}
            {message.description && (
              <p className={`text-sm ${getTextColor('info')} mt-1 opacity-90`}>
                {message.description}
              </p>
            )}
          </div>
          {message.action && (
            <button
              onClick={() => {
                message.action!.onClick();
                sonnerToast.dismiss(id);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              {message.action.label}
            </button>
          )}
        </div>
      ),
      {
        duration: message.duration || 3000,
      }
    );
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

export function EnhancedToaster() {
  return (
    <Toaster
      position="top-right"
      richColors={true}
      closeButton={true}
      theme="light"
      expand={true}
      visibleToasts={3}
      gap={8}
      style={{
        fontSize: '14px',
      }}
    />
  );
}
