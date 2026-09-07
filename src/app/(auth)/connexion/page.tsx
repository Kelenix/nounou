import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/auth-shell";
import { EmailAuthForm } from "@/features/auth/email-auth-form";
import { FullPageSpinner } from "@/components/ui/spinner";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("auth.loginMetaTitle") };
}

export default async function ConnexionPage() {
  const t = await getTranslations();
  return (
    <AuthShell
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link href="/inscription" className="font-semibold text-primary hover:underline">{t("auth.createAccount")}</Link>
        </>
      }
    >
      <Suspense fallback={<FullPageSpinner />}>
        <EmailAuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
