"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck, Clock, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { VerificationLevel } from "@/lib/supabase/database.types";

/**
 * Téléversement de la pièce d'identité (bucket privé `identity-docs`).
 * Le document est ensuite validé par un admin (→ badge « Identité vérifiée »).
 */
export function IdentityDocUpload({
  userId,
  hasDoc,
  level,
}: {
  userId: string;
  hasDoc: boolean;
  level: VerificationLevel;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const verified = level === "identity" || level === "verified";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(t("identity.tooLarge"), "error");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("identity-docs").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast(t("identity.uploadFailed"), "error");
      return;
    }
    const { error: upErr } = await supabase.from("profiles").update({ identity_doc_path: path }).eq("id", userId);
    setUploading(false);
    if (upErr) {
      toast(t("identity.uploadFailed"), "error");
      return;
    }
    toast(t("identity.uploaded"), "success");
    router.refresh();
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary-soft/40 px-4 py-3 text-sm font-medium text-primary">
        <BadgeCheck className="size-5" /> {t("identity.verified")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasDoc ? (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <Clock className="size-5" /> {t("identity.pending")}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("identity.explain")}</p>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {uploading ? <Spinner className="size-4" /> : <Upload className="size-4" />}
        {hasDoc ? t("identity.replace") : t("identity.upload")}
      </button>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
    </div>
  );
}
