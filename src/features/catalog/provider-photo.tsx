import { User } from "lucide-react";
import { cn } from "@/lib/utils";

// Palette de dégradés doux ; choisi de façon déterministe par personne.
const GRADIENTS = [
  "from-primary-soft via-emerald-50 to-emerald-100",
  "from-amber-50 via-orange-50 to-rose-100",
  "from-sky-50 via-blue-50 to-indigo-100",
  "from-violet-50 via-purple-50 to-fuchsia-100",
  "from-rose-50 via-pink-50 to-red-100",
  "from-teal-50 via-cyan-50 to-sky-100",
];

function pick(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/**
 * Grande photo d'un prestataire : la photo si disponible, sinon un visuel de repli
 * (dégradé varié + initiales). `loading="lazy"` pour le réseau lent.
 */
export function ProviderPhoto({
  src,
  name,
  seed,
  className,
  initialsClassName,
}: {
  src?: string | null;
  name: string;
  seed: string;
  className?: string;
  initialsClassName?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} loading="lazy" className={cn("size-full object-cover", className)} />
    );
  }
  return (
    <div className={cn("flex size-full items-center justify-center bg-gradient-to-br", pick(seed), className)}>
      <span className={cn("flex items-center justify-center rounded-full bg-white/70 font-extrabold text-primary shadow-sm", initialsClassName ?? "size-20 text-2xl")}>
        {initials || <User className="size-9" />}
      </span>
    </div>
  );
}
