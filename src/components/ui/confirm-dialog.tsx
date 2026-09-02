"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Boîte de dialogue de confirmation générique (message + infos + Confirmer/Annuler). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl data-[state=open]:animate-scale-in">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                destructive ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary",
              )}
            >
              <AlertTriangle className="size-5" />
            </span>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-full p-1 text-muted-foreground hover:bg-accent" aria-label="Fermer">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {children && <div className="mt-4">{children}</div>}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={loading}>{cancelLabel}</Button>
            </Dialog.Close>
            <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
              {loading ? <Spinner className={destructive ? "text-destructive-foreground" : "text-primary-foreground"} /> : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
