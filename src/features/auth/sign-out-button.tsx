"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace("/"); // retour à l'accueil (marketplace)
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        onClick={signOut}
        disabled={loading}
        aria-label={t("appNav.signOut")}
        className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-5" />
      </button>
    );
  }

  return (
    <Button variant="secondary" className="w-full" onClick={signOut} disabled={loading}>
      <LogOut className="size-4" /> {t("appNav.signOut")}
    </Button>
  );
}
