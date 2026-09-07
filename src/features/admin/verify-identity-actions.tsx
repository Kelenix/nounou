"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function VerifyIdentityActions({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    const res = await fetch("/api/admin/verify-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setLoading(null);
    if (!res.ok) {
      toast(t("verifications.actionFailed"), "error");
      return;
    }
    toast(action === "approve" ? t("verifications.approved") : t("verifications.rejected"), "success");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => act("approve")} disabled={loading !== null}>
        {loading === "approve" ? <Spinner className="size-4 text-primary-foreground" /> : <BadgeCheck className="size-4" />}
        {t("verifications.approve")}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => act("reject")} disabled={loading !== null}>
        {loading === "reject" ? <Spinner className="size-4" /> : <X className="size-4" />}
        {t("verifications.reject")}
      </Button>
    </div>
  );
}
