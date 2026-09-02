import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Avatar simple : la photo si l'utilisateur en a mis une, sinon un emplacement
 * VIDE (silhouette neutre). Aucun visuel n'est assigné automatiquement : tant
 * que la personne n'a pas choisi de photo, la zone reste vide.
 */
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
  const alt = `${prenom ?? ""} ${nom ?? ""}`.trim() || "Profil";
  return (
    <span
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </span>
  );
}
