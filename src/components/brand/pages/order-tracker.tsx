"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  MapPin,
  Phone,
  Star,
  Bike,
  CheckCircle2,
  Clock,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RiderTrackingMap } from "../map/RiderTrackingMap";
import type { OrderTracking } from "@/lib/types";

const STEP_ICONS = [Package, CheckCircle2, Bike, MapPin];

export function OrderTracker({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [data, setData] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open || !orderId) return;
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`).then((r) => r.json());
        if (alive) setData(res as OrderTracking);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    load();
    // Poll every 5s so the timeline + ETA feel live.
    timerRef.current = setInterval(load, 5000);

    return () => {
      alive = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, orderId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bike className="text-brand" size={20} /> Live order tracking
          </DialogTitle>
          <DialogDescription className="text-xs">
            {orderId
              ? `Order #${orderId.slice(-8).toUpperCase()} · updates every 5s`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" /> Locating your rider…
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Couldn&apos;t load tracking. Please try again.
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* ETA + progress */}
            <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-white/70">
                    {data.status === "DELIVERED"
                      ? "Delivered"
                      : "Arriving in"}
                  </div>
                  <div className="text-3xl font-extrabold">
                    {data.status === "DELIVERED"
                      ? "Enjoy! 🎉"
                      : `~${data.etaMinutes} min`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-white/70">
                    Progress
                  </div>
                  <div className="text-2xl font-extrabold">
                    {data.progressPct}%
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-700"
                  style={{ width: `${data.progressPct}%` }}
                />
              </div>
              {data.status !== "DELIVERED" && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/80">
                  <Clock size={11} /> Est. delivery{" "}
                  {new Date(data.estimatedDeliveryAt).toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>

            {/* Live map */}
            {data.map && (data.map.vendor || data.map.customer) && (
              <RiderTrackingMap
                tracking={data}
                className="h-52 w-full overflow-hidden rounded-2xl border border-border"
              />
            )}

            {/* Rider card */}
            {data.rider && (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-light text-brand">
                  <Bike size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {data.rider.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">{data.rider.plate}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Star size={10} className="fill-gold text-gold" />
                      {data.rider.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3"
                  asChild
                >
                  <a href={`tel:${data.rider.phone.replace(/\s/g, "")}`}>
                    <Phone size={14} /> Call
                  </a>
                </Button>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-1">
              {data.steps.map((s, i) => {
                const Icon = STEP_ICONS[i] ?? CheckCircle2;
                const isLast = i === data.steps.length - 1;
                return (
                  <div key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
                          s.reached
                            ? "bg-brand text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "my-1 w-0.5 flex-1 min-h-7",
                            data.steps[i + 1].reached ? "bg-brand" : "bg-muted"
                          )}
                        />
                      )}
                    </div>
                    <div className={cn("pb-4", !isLast && "min-h-12")}>
                      <div
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          !s.reached && "text-muted-foreground"
                        )}
                      >
                        {s.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.description}
                      </div>
                      {s.at && s.reached && (
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(s.at).toLocaleTimeString("en-KE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} /> Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
