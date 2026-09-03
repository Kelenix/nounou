"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ReportStatus } from "@/lib/supabase/database.types";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: ReportStatus) {
    setLoading(true);
    const { error } = await createClient().from("reports").update({ status }).eq("id", reportId);
    setLoading(false);
    if (error) {
      toast(t("admin.reportActionFailed"), "error");
      return;
    }
    toast(status === "traite" ? t("admin.reportResolved") : t("admin.reportRejected"), "success");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={() => setStatus("rejete")} disabled={loading}>
        <X className="size-4" /> {t("admin.reject")}
      </Button>
      <Button size="sm" onClick={() => setStatus("traite")} disabled={loading}>
        <Check className="size-4" /> {t("admin.markResolved")}
      </Button>
    </div>
  );
}
