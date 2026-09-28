"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

/** Formulaire de contact public : envoie le message à /api/contact (Resend). */
export function ContactForm() {
  const t = useTranslations();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 1 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.trim().length < 5) {
      setError(t("contact.form.invalid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject: subject.trim() || undefined, message, website }),
      });
      const data = await res.json().catch(() => null);
      setLoading(false);
      if (!res.ok) {
        setError(res.status === 503 ? t("contact.form.unavailable") : (data?.error ?? t("contact.form.error")));
        return;
      }
      setDone(true);
      toast(t("contact.form.success"), "success");
    } catch {
      setLoading(false);
      setError(t("contact.form.error"));
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-6 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <h2 className="text-lg font-bold">{t("contact.form.successTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("contact.form.successBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-bold">{t("contact.form.title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-name">{t("contact.form.name")}</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contact.form.namePlaceholder")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">{t("contact.form.email")}</Label>
          <Input id="c-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contact.form.emailPlaceholder")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-subject">{t("contact.form.subject")}</Label>
        <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("contact.form.subjectPlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-message">{t("contact.form.message")}</Label>
        <Textarea id="c-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("contact.form.messagePlaceholder")} />
      </div>

      {/* Honeypot anti-bot : caché des humains. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : <><Send className="size-4" /> {t("contact.form.send")}</>}
      </Button>
    </form>
  );
}
