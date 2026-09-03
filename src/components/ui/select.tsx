import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select natif stylé — volontairement basé sur `<select>` : sur mobile Android,
 * le picker natif est plus léger et plus accessible qu'un menu custom.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <div className="relative min-w-0">
      <select
        ref={ref}
        className={cn(
          // `min-w-0` + `text-ellipsis` : le libellé long (ex. « Assistance aux personnes âgées »)
          // tronque au lieu de forcer un débordement horizontal du conteneur.
          "flex h-11 w-full min-w-0 appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl border border-input bg-background px-4 py-2 pr-10 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  ),
);
Select.displayName = "Select";

export { Select };
