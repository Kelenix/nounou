import { BadgeCheck, ShieldCheck, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VerificationLevel } from "@/lib/supabase/database.types";

const META: Record<VerificationLevel, { label: string; icon: typeof Phone; className: string }> = {
  phone: { label: "Téléphone vérifié", icon: Phone, className: "bg-secondary text-muted-foreground" },
  identity: { label: "Identité vérifiée", icon: BadgeCheck, className: "bg-blue-100 text-blue-700" },
  verified: { label: "Profil vérifié", icon: ShieldCheck, className: "bg-primary-soft text-primary" },
};

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  const m = META[level];
  const Icon = m.icon;
  return (
    <Badge className={m.className}>
      <Icon className="size-3" /> {m.label}
    </Badge>
  );
}
