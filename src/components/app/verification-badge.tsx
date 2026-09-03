import { BadgeCheck, ShieldCheck, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { VerificationLevel } from "@/lib/supabase/database.types";

const META: Record<VerificationLevel, { icon: typeof Phone; className: string }> = {
  phone: { icon: Phone, className: "bg-secondary text-muted-foreground" },
  identity: { icon: BadgeCheck, className: "bg-blue-100 text-blue-700" },
  verified: { icon: ShieldCheck, className: "bg-primary-soft text-primary" },
};

export async function VerificationBadge({ level }: { level: VerificationLevel }) {
  const t = await getTranslations();
  const m = META[level];
  const Icon = m.icon;
  return (
    <Badge className={m.className}>
      <Icon className="size-3" /> {t(`verification.${level}`)}
    </Badge>
  );
}
