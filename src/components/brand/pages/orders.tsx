"use client";

import { useState } from "react";
import {
  ClipboardList,
  Truck,
  MapPin,
  Package,
  Loader2,
  Bike,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KES } from "../logo";
import { StatusPill } from "../ui";
import { EmptyState } from "./cart";
import { OrderTracker } from "./order-tracker";
import type { CartItem, Order, PageId } from "@/lib/types";

export function OrdersPage({
  orders,
  loading,
  onNavigate,
  onReorder,
}: {
  orders: Order[];
  loading: boolean;
  onNavigate: (p: PageId) => void;
  onReorder: (items: CartItem[]) => void;
}) {
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackerOpen, setTrackerOpen] = useState(false);

  const openTracker = (id: string) => {
    setTrackingId(id);
    setTrackerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Loading orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-5">
        <PageHead
          icon={<ClipboardList className="text-brand" size={24} />}
          title="Your Orders"
        />
        <EmptyState
          emoji="📭"
          title="No orders yet"
          desc="Build a Smart Basket and place your first order in minutes."
          cta="Start a Smart Basket"
          onCta={() => onNavigate("basket")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHead
        icon={<ClipboardList className="text-brand" size={24} />}
        title={`Your Orders (${orders.length})`}
      />
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold">
                  #{o.id.slice(-8).toUpperCase()}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <StatusPill status={o.status} />
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{o.vendor.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{o.vendor.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {o.vendor.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-brand">
                    {KES(o.total)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {o.items.reduce((s, it) => s + it.qty, 0)} items
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} /> {o.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Truck size={11} /> {KES(o.deliveryFee)} delivery
                </span>
                {o.mpesaCode && (
                  <span className="inline-flex items-center gap-1 font-semibold text-mpesa">
                    <Package size={11} /> {o.mpesaCode}
                  </span>
                )}
              </div>

              {/* Items preview */}
              <div className="flex flex-wrap gap-1.5">
                {o.items.slice(0, 6).map((it, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[11px] text-brand"
                  >
                    <span>{it.emoji}</span>
                    {it.name} ×{it.qty}
                  </span>
                ))}
                {o.items.length > 6 && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{o.items.length - 6} more
                  </span>
                )}
              </div>

              {/* Status timeline */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                {["PLACED", "CONFIRMED", "DISPATCHED", "DELIVERED"].map(
                  (step, i, arr) => {
                    const order = ["PLACED", "CONFIRMED", "DISPATCHED", "DELIVERED"];
                    const reached = order.indexOf(o.status) >= i;
                    return (
                      <div key={step} className="flex flex-1 items-center gap-1.5">
                        <div
                          className={
                            "h-1.5 flex-1 rounded-full " +
                            (reached ? "bg-brand" : "bg-muted")
                          }
                        />
                        <span
                          className={
                            reached
                              ? "font-semibold text-brand"
                              : "text-muted-foreground"
                          }
                        >
                          {step.charAt(0)}
                        </span>
                        {i < arr.length - 1 && (
                          <div
                            className={
                              "h-1.5 flex-1 rounded-full " +
                              (reached ? "bg-brand/40" : "bg-muted")
                            }
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-brand text-white hover:bg-brand-dark"
                  onClick={() => openTracker(o.id)}
                >
                  <Bike size={14} /> Track live
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReorder(o.items as CartItem[])}
                >
                  <RefreshCw size={14} /> Buy it again
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <OrderTracker
        orderId={trackingId}
        open={trackerOpen}
        onOpenChange={setTrackerOpen}
      />
    </div>
  );
}

export function PageHead({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-2xl font-extrabold">{title}</h1>
      </div>
      {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}
