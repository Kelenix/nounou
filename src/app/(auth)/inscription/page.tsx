import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/auth-shell";
import { EmailAuthForm } from "@/features/auth/email-auth-form";
import { FullPageSpinner } from "@/components/ui/spinner";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("auth.registerMetaTitle") };
}

export default async function InscriptionPage() {
  const t = await getTranslations();
  return (
    <AuthShell
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link href="/connexion" className="font-semibold text-primary hover:underline">{t("auth.login")}</Link>
        </>
      }
    >
      <Suspense fallback={<FullPageSpinner />}>
        <EmailAuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
