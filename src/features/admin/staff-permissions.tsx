"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { STAFF_SECTIONS } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

export function StaffPermissions({
  userId,
  initial,
}: {
  userId: string;
  initial: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [perms, setPerms] = useState<Set<string>>(new Set(initial));
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setLoading(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, permissions: Array.from(perms) }),
    });
    setLoading(false);
    if (!res.ok) {
      toast("Enregistrement impossible.", "error");
      return;
    }
    toast("Permissions mises à jour", "success");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions (sections accessibles)</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STAFF_SECTIONS.map((s) => {
          const active = perms.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors",
                active ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground",
              )}
            >
              <span className={cn("flex size-4 items-center justify-center rounded border", active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                {active && <Check className="size-3" />}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>
      <Button size="sm" onClick={save} disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : <><Save className="size-4" /> Enregistrer les permissions</>}
      </Button>
    </div>
  );
}
