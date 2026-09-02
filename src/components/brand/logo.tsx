import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo « J'ai ma nounou ».
 * L'image (`public/logo.png`) contient déjà le symbole + le nom.
 * Remplacez `public/logo.png` par le logo fourni (cf. docs/manual-tasks.md).
 */
export function Logo({
  className,
  href = "/",
  height = 40,
  priority = false,
}: {
  className?: string;
  href?: string | null;
  height?: number;
  priority?: boolean;
}) {
  const img = (
    <Image
      src="/logo.png"
      alt="J'ai ma nounou"
      width={Math.round(height * 1.5)}
      height={height}
      priority={priority}
      className="h-auto w-auto object-contain"
      style={{ height, width: "auto" }}
    />
  );

  if (href === null) {
    return <span className={cn("inline-flex items-center", className)}>{img}</span>;
  }
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="J'ai ma nounou">
      {img}
    </Link>
  );
}
