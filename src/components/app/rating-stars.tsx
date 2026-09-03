import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

export async function RatingStars({
  value,
  count,
  size = "sm",
}: {
  value: number | null;
  count?: number;
  size?: "sm" | "md";
}) {
  const t = await getTranslations();
  const v = value ?? 0;
  const px = size === "md" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(px, i <= Math.round(v) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          />
        ))}
      </div>
      {value != null ? (
        <span className="text-sm font-semibold">{v.toFixed(1)}</span>
      ) : (
        <span className="text-sm text-muted-foreground">{t("rating.noRating")}</span>
      )}
      {typeof count === "number" && count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
