import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/features/auth/auth-shell";
import { PhoneAuthForm } from "@/features/auth/phone-auth-form";
import { FullPageSpinner } from "@/components/ui/spinner";

export const metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <AuthShell
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-primary hover:underline">Créer un compte</Link>
        </>
      }
    >
      <Suspense fallback={<FullPageSpinner />}>
        <PhoneAuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
