import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { FullPageSpinner } from "@/components/ui/spinner";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("auth.resetMetaTitle") };
}

export default function ReinitialiserMotDePassePage() {
  return (
    <AuthShell footer={null}>
      <Suspense fallback={<FullPageSpinner />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
