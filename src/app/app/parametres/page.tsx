import Link from "next/link";
import { User, ShieldAlert, FileText, Bell, Pencil, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/app/verification-badge";
import { DeleteAccountButton } from "@/features/account/delete-account-button";
import { formatPhoneCi } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("settings.metaTitle") };
}

export default async function ParametresPage() {
  const profile = await requireProfile();
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("settings.title")}</h1>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary"><User className="size-4" /></span>
            <h2 className="font-bold">{t("settings.account")}</h2>
          </div>
          <Row label={t("settings.fullName")} value={`${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || "—"} />
          <Row label={t("settings.phone")} value={formatPhoneCi(profile.phone)} />
          <Row label={t("settings.role")} value={profile.role === "employer" ? t("roles.employer") : profile.role === "candidate" ? t("roles.candidate") : t("roles.admin")} />
          <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
            <span className="text-sm text-muted-foreground">{t("settings.verification")}</span>
            <VerificationBadge level={profile.verification_level} />
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/app/profil/modifier"><Pencil className="size-4" /> {t("settings.editInfo")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary"><Bell className="size-4" /></span>
            <h2 className="font-bold">{t("settings.preferences")}</h2>
          </div>
          <LinkRow href="/app/notifications" icon={<Bell className="size-4" />} label={t("settings.notifications")} />
          <LinkRow href="/app/signalements" icon={<ShieldAlert className="size-4" />} label={t("settings.myReports")} />
          <LinkRow href="/cgu" icon={<FileText className="size-4" />} label={t("settings.terms")} />
          <LinkRow href="/confidentialite" icon={<FileText className="size-4" />} label={t("settings.privacy")} />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 className="size-4" /></span>
            <h2 className="font-bold text-destructive">{t("settings.dangerZone")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("settings.deleteWarning")}
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LinkRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-secondary">
      <span className="text-primary">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
