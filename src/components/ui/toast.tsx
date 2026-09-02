"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return ctx;
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const toast = React.useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-card p-3 shadow-lg",
                t.variant === "success" && "border-primary/30",
                t.variant === "error" && "border-destructive/30",
              )}
              role="status"
            >
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  t.variant === "success" && "text-primary",
                  t.variant === "error" && "text-destructive",
                  t.variant === "info" && "text-muted-foreground",
                )}
              />
              <p className="flex-1 text-sm">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="Fermer">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
