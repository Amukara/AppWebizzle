"use client";

import { MapPin, Crosshair, X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationStatus } from "@/hooks/use-geolocation";

type Props = {
  open: boolean;
  status: LocationStatus;
  error: string | null;
  /** The context in which the prompt was triggered */
  reason: "search" | "checkout";
  onEnable: () => void;
  onDismiss: () => void;
};

export function LocationPrompt({
  open,
  status,
  error,
  reason,
  onEnable,
  onDismiss,
}: Props) {
  if (!open) return null;

  const isPrompting = status === "prompting";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isPrompting ? undefined : onDismiss}
      />

      {/* Sheet / card */}
      <div className="relative z-10 mx-4 mb-4 w-full max-w-md animate-in slide-in-from-bottom-4 fade-in-0 rounded-2xl border border-border bg-card p-6 shadow-2xl sm:mb-0 sm:slide-in-from-bottom-0 sm:slide-in-from-top-4">
        {/* Close button */}
        {!isPrompting && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Icon */}
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-light">
          {isPrompting ? (
            <Loader2 size={26} className="animate-spin text-brand" />
          ) : (
            <MapPin size={26} className="text-brand" />
          )}
        </div>

        {/* Title & description */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-bold">
            {isPrompting
              ? "Getting your location\u2026"
              : reason === "search"
                ? "Find vendors near you"
                : "Share your delivery location"}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isPrompting
              ? "Please allow location access when prompted by your browser."
              : reason === "search"
                ? "Enable location services so WeBizzle can show you the closest vendors, faster delivery times, and accurate prices for your area."
                : "We need your location to assign the nearest rider and give them precise directions for a quick delivery."}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 rounded-xl bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          {(status === "idle" || status === "denied" || status === "unavailable") && (
            <>
              <Button
                className="w-full bg-brand text-white hover:bg-brand-dark"
                onClick={onEnable}
              >
                <Crosshair size={16} className="mr-2" />
                Enable location services
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                {reason === "search" ? "Search without location" : "Enter address manually"}
              </Button>
            </>
          )}
        </div>

        {/* Trust badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck size={12} className="text-brand" />
          Your location is only used for delivery and vendor matching.
        </div>
      </div>
    </div>
  );
}