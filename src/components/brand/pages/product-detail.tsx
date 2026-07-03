"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  Clock,
  MapPin,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { KES } from "../logo";
import { RatingStars } from "../ui";
import type { PriceHistory, Product } from "@/lib/types";

export function ProductDetail({
  product,
  open,
  onOpenChange,
  onAdd,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: () => void;
}) {
  const [data, setData] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    let alive = true;
    setLoading(true);
    setData(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/price-history?productId=${product.id}`
        ).then((r) => r.json());
        if (alive) setData(res as PriceHistory);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2.5">
            <span className="text-2xl">{product?.emoji}</span>
            <span>{product?.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {product?.unit} · price intelligence across {product?.vendorCount ?? 0}{" "}
            vendors
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[72vh]">
          <div className="space-y-5 p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 size={18} className="animate-spin" /> Loading price
                history…
              </div>
            ) : !data ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Couldn&apos;t load price data.
              </div>
            ) : (
              <>
                {/* Current price + trend */}
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Best price now
                    </div>
                    <div className="text-3xl font-extrabold text-brand">
                      {KES(data.current)}
                    </div>
                  </div>
                  <TrendBadge trend={data.trend} changePct={data.changePct} isLow={data.isLow} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="14-day low" value={KES(data.low)} />
                  <Stat label="14-day avg" value={KES(data.avg)} />
                  <Stat label="14-day high" value={KES(data.high)} />
                </div>

                {/* History chart */}
                <div className="rounded-2xl border border-border bg-card p-3">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold">
                      14-day price history
                    </span>
                    {data.isLow ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                        <CheckCircle2 size={11} /> At a low
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        vs today {KES(data.current)}
                      </span>
                    )}
                  </div>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.points}
                        margin={{ top: 6, right: 6, left: 6, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d: string) =>
                            new Date(d).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                            })
                          }
                          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                          domain={["dataMin - 5", "dataMax + 5"]}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            fontSize: 12,
                          }}
                          labelFormatter={(d: string) =>
                            new Date(d).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                            })
                          }
                          formatter={(v: number) => [KES(v), "Price"]}
                        />
                        <ReferenceLine
                          y={data.current}
                          stroke="var(--brand)"
                          strokeDasharray="4 4"
                          strokeOpacity={0.5}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="var(--brand)"
                          strokeWidth={2}
                          fill="url(#priceFill)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Vendor ranking */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold">All vendors, ranked</h4>
                  <div className="space-y-1.5">
                    {data.vendors.map((v, i) => (
                      <div
                        key={v.vendorId}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border bg-card p-2.5",
                          i === 0 ? "border-brand ring-1 ring-brand/20" : "border-border"
                        )}
                      >
                        <span className="text-lg">{v.vendorEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">
                              {v.vendorName}
                            </span>
                            {i === 0 && (
                              <Badge className="bg-brand-light px-1.5 py-0 text-[10px] text-brand">
                                Cheapest
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <RatingStars rating={v.rating} size={10} />
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Clock size={10} /> {v.etaMinutes}m
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{KES(v.price)}</div>
                          {i > 0 && (
                            <div className="text-[10px] text-destructive">
                              +{KES(v.price - data.vendors[0].price)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-brand text-white hover:bg-brand-dark"
                  onClick={() => {
                    onAdd();
                    onOpenChange(false);
                  }}
                >
                  <ShoppingBag size={16} /> Add to Smart Basket
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

export function TrendBadge({
  trend,
  changePct,
  isLow,
  className,
}: {
  trend: "down" | "stable" | "up";
  changePct: number;
  isLow?: boolean;
  className?: string;
}) {
  if (isLow) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand",
          className
        )}
      >
        <TrendingDown size={11} /> 14-day low
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700",
          className
        )}
      >
        <TrendingDown size={11} /> {Math.abs(changePct)}%
      </span>
    );
  }
  if (trend === "up") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700",
          className
        )}
      >
        <TrendingUp size={11} /> {changePct}%
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground",
        className
      )}
    >
      <Minus size={11} /> stable
    </span>
  );
}
