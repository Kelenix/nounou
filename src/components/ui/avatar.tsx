import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/** Avatar simple : photo si disponible, sinon initiales / icône. */
export function Avatar({
  src,
  nom,
  prenom,
  className,
}: {
  src?: string | null;
  nom?: string | null;
  prenom?: string | null;
  className?: string;
}) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={initials || "Profil"} className="size-full object-cover" />
      ) : initials ? (
        <span className="text-sm font-bold">{initials}</span>
      ) : (
        <User className="size-6" />
      )}
    </span>
  );
}
