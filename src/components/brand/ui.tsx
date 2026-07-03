import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 12,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <Star size={size} className="fill-gold text-gold" />
      <span className="font-semibold text-foreground/80">{rating.toFixed(1)}</span>
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PLACED: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-sky-100 text-sky-800",
    DISPATCHED: "bg-violet-100 text-violet-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        map[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
