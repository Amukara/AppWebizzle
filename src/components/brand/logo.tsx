import { cn } from "@/lib/utils";

export function KES(n: number): string {
  return `KES ${Number(n || 0).toLocaleString("en-KE")}`;
}

export function Logo({
  size = 40,
  withTagline = false,
  className,
}: {
  size?: number;
  withTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="flex items-center gap-2.5">
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="31" fill="var(--brand)" />
          <path
            d="M18 26h28l-3.4 18.4a4 4 0 0 1-3.94 3.3H25.34a4 4 0 0 1-3.94-3.3L18 26Z"
            fill="#FFFFFF"
          />
          <path
            d="M23 26c0-6 4-10.5 9-10.5s9 4.5 9 10.5"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="27" cy="34" r="2.4" fill="var(--gold)" />
          <circle cx="37" cy="34" r="2.4" fill="var(--gold)" />
          <circle cx="32" cy="40" r="2.4" fill="var(--gold)" />
        </svg>
        <span
          className="font-extrabold tracking-tight text-foreground leading-none"
          style={{ fontSize: size * 0.42 }}
        >
          We<span className="text-brand">Bizzle</span>
          <span className="text-gold">!</span>
        </span>
      </div>
      {withTagline && (
        <span className="italic text-muted-foreground" style={{ fontSize: 12 }}>
          Compare. Buy. Deliver.
        </span>
      )}
    </div>
  );
}
