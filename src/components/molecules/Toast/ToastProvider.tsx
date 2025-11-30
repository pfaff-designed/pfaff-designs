"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Toast, type ToastVariant } from "./Toast";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = React.useCallback((variant: ToastVariant, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, variant, message, duration }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-[4.5rem] md:top-20 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 max-w-md w-full px-4">
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                variant={toast.variant}
                message={toast.message}
                duration={toast.duration}
                onDismiss={() => removeToast(toast.id)}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

