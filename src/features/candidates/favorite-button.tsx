"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  employerId,
  candidateId,
  initial,
}: {
  employerId: string;
  candidateId: string;
  initial: boolean;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();
  const [fav, setFav] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (fav) {
      await supabase.from("favorites").delete().eq("employer_id", employerId).eq("candidate_id", candidateId);
      setFav(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ employer_id: employerId, candidate_id: candidateId });
      if (!error) {
        setFav(true);
        toast(t("favorites.added"), "success");
      }
    }
    setLoading(false);
  }

  return (
    <Button variant="secondary" className="w-full" onClick={toggle} disabled={loading}>
      <Heart className={cn("size-4", fav && "fill-destructive text-destructive")} />
      {fav ? t("favorites.remove") : t("favorites.add")}
    </Button>
  );
}
