"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

/** Compose et diffuse une annonce système à tous les utilisateurs (cloche + e-mail). */
export function AnnonceForm() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSend = titre.trim().length >= 3 && message.trim().length >= 3 && confirmed && !loading;

  async function send() {
    if (!canSend) return;
    setLoading(true);
    const res = await fetch("/api/admin/annonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: titre.trim(), message: message.trim() }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      toast(data?.error ?? t("annonces.failed"), "error");
      return;
    }
    toast(t("annonces.sent", { count: data?.count ?? 0 }), "success");
    setTitre("");
    setMessage("");
    setConfirmed(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="annonce-titre">{t("annonces.titreLabel")}</Label>
        <Input
          id="annonce-titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder={t("annonces.titrePlaceholder")}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="annonce-message">{t("annonces.messageLabel")}</Label>
        <Textarea
          id="annonce-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("annonces.messagePlaceholder")}
          rows={4}
          maxLength={1000}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>{t("annonces.warning")}</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="size-4 rounded border-input"
        />
        {t("annonces.confirmCheckbox")}
      </label>

      <Button onClick={send} disabled={!canSend} className="w-full sm:w-auto">
        {loading ? <Spinner className="text-primary-foreground" /> : <><Send className="size-4" /> {t("annonces.send")}</>}
      </Button>
    </div>
  );
}
