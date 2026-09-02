import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/features/auth/auth-shell";
import { PhoneAuthForm } from "@/features/auth/phone-auth-form";
import { FullPageSpinner } from "@/components/ui/spinner";

export const metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return (
    <AuthShell
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-primary hover:underline">Se connecter</Link>
        </>
      }
    >
      <Suspense fallback={<FullPageSpinner />}>
        <PhoneAuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
