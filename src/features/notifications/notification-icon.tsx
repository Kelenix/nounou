import {
  FileText,
  CheckCircle2,
  XCircle,
  CreditCard,
  BadgeCheck,
  Flag,
  MessageCircle,
  Bell,
} from "lucide-react";
import type { NotificationType } from "@/lib/supabase/database.types";

const MAP: Record<NotificationType, typeof Bell> = {
  nouvelle_candidature: FileText,
  candidature_acceptee: CheckCircle2,
  candidature_refusee: XCircle,
  paiement_confirme: CreditCard,
  profil_verifie: BadgeCheck,
  signalement: Flag,
  nouveau_message: MessageCircle,
  systeme: Bell,
};

export function NotificationIcon({ type }: { type: NotificationType }) {
  const Icon = MAP[type] ?? Bell;
  return <Icon className="size-5" />;
}
