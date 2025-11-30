"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: ToastVariant;
  message: string;
  onDismiss?: () => void;
  duration?: number; // Auto-dismiss duration in milliseconds
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ variant, message, onDismiss, duration = 5000, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      if (duration > 0 && onDismiss) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          // Wait for animation to complete before calling onDismiss
          setTimeout(() => {
            onDismiss();
          }, 200);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    const handleDismiss = React.useCallback(() => {
      setIsVisible(false);
      if (onDismiss) {
        setTimeout(() => {
          onDismiss();
        }, 200);
      }
    }, [onDismiss]);

    const variantStyles = {
      success: "bg-[color:var(--bg-surface)] border-[color:var(--state-success)] text-[color:var(--state-success)]",
      error: "bg-[color:var(--bg-surface)] border-[color:var(--state-error)] text-[color:var(--state-error)]",
    };

    const iconMap = {
      success: CheckCircle2,
      error: AlertCircle,
    };

    const Icon = iconMap[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg transition-all duration-200",
          variantStyles[variant],
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[100%]",
          className
        )}
        {...props}
      >
        <Icon className="size-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium flex-1">{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[color:var(--text-default)] focus:ring-offset-2"
            aria-label="Dismiss toast"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = "Toast";

export { Toast };

