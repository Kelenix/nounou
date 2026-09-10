import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { FullPageSpinner } from "@/components/ui/spinner";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("auth.forgotMetaTitle") };
}

export default function MotDePasseOubliePage() {
  return (
    <AuthShell footer={null}>
      <Suspense fallback={<FullPageSpinner />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
