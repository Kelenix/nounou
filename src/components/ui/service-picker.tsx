"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_OPTIONS } from "@/lib/constants";
import type { ServiceType } from "@/lib/supabase/database.types";

/** Sélecteur multiple de services sous forme de pastilles. */
export function ServicePicker({
  value,
  onChange,
}: {
  value: ServiceType[];
  onChange: (next: ServiceType[]) => void;
}) {
  function toggle(s: ServiceType) {
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {SERVICE_OPTIONS.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-background text-muted-foreground",
            )}
          >
            {active && <Check className="size-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
