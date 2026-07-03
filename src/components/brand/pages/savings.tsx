"use client";

import { useEffect, useState } from "react";
import {
  PiggyBank,
  TrendingDown,
  ShoppingBag,
  Percent,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KES } from "../logo";
import { PageHead } from "./orders";
import { cn } from "@/lib/utils";
import type { PageId, SavingsSummary } from "@/lib/types";

export function SavingsPage({
  onNavigate,
}: {
  onNavigate: (p: PageId) => void;
}) {
  const [data, setData] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/savings").then((r) => r.json());
        if (alive) setData(res as SavingsSummary);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Crunching your savings…
      </div>
    );
  }

  if (!data || data.orderCount === 0) {
    return (
      <div className="space-y-5">
        <PageHead
          icon={<PiggyBank className="text-brand" size={24} />}
          title="Your Savings"
          desc="Every time WeBizzle finds you a cheaper vendor, we bank the difference here."
        />
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="text-6xl" aria-hidden>🐷</div>
          <h2 className="text-xl font-bold">No savings yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Place your first order and we&apos;ll start tracking how much you save
            versus average neighbourhood prices.
          </p>
          <Button
            className="mt-2 bg-brand text-white hover:bg-brand-dark"
            onClick={() => onNavigate("basket")}
          >
            Build a Smart Basket
          </Button>
        </div>
      </div>
    );
  }

  const maxCatSaved = Math.max(1, ...data.byCategory.map((c) => c.saved));

  return (
    <div className="space-y-6">
      <PageHead
        icon={<PiggyBank className="text-brand" size={24} />}
        title="Your Savings"
        desc="Tracked against the average price across every verified vendor."
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-dark p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <TrendingDown size={12} /> All-time savings
          </span>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {KES(data.totalSaved)}
            </span>
            <span className="mb-1.5 text-sm text-white/80">
              saved on {data.orderCount} order{data.orderCount !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/80">
            That&apos;s {data.avgSavingsPct}% below market-average prices — real
            money back in your pocket.
          </p>
          {data.streakWeeks > 0 && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
              <Flame size={12} /> {data.streakWeeks}-week shopping streak
            </span>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<PiggyBank size={16} />}
          label="Total saved"
          value={KES(data.totalSaved)}
          accent="brand"
        />
        <StatCard
          icon={<ShoppingBag size={16} />}
          label="Orders placed"
          value={String(data.orderCount)}
          accent="gold"
        />
        <StatCard
          icon={<Percent size={16} />}
          label="Avg. savings"
          value={`${data.avgSavingsPct}%`}
          accent="brand"
        />
        <StatCard
          icon={<Sparkles size={16} />}
          label="Saved / order"
          value={KES(data.avgSavedPerOrder)}
          accent="gold"
        />
      </div>

      {/* CATEGORY BREAKDOWN */}
      {data.byCategory.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold">Where you save the most</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Savings by category versus average vendor prices.
          </p>
          <div className="mt-4 space-y-3">
            {data.byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.category}</span>
                  <span className="text-muted-foreground">
                    Saved <span className="font-bold text-brand">{KES(c.saved)}</span>
                    <span className="mx-1">·</span>
                    Spent {KES(c.spent)}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark"
                    style={{ width: `${Math.round((c.saved / maxCatSaved) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RECENT SAVINGS */}
      {data.recent.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-bold">Recent savings</h3>
          </div>
          <div className="divide-y divide-border">
            {data.recent.map((r) => (
              <div
                key={r.orderId}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="text-xl">{r.vendorEmoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {r.vendorName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand">
                    −{KES(r.saved)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    of {KES(r.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline"
          className="bg-brand text-white hover:bg-brand-dark"
          onClick={() => onNavigate("basket")}
        >
          <ShoppingBag size={16} /> Save more on my next basket
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "brand" | "gold";
}) {
  return (
    <Card className="p-4">
      <div
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg",
          accent === "brand" ? "bg-brand-light text-brand" : "bg-gold/15 text-gold-dark"
        )}
      >
        {icon}
      </div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-extrabold">{value}</div>
    </Card>
  );
}

// Compact home widget — self-fetches its savings summary
export function SavingsWidget({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/savings").then((r) => r.json());
        if (alive) setSummary(res as SavingsSummary);
      } catch {
        if (alive) setSummary(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-light text-brand">
          <Loader2 size={18} className="animate-spin" />
        </div>
        <div className="text-sm text-muted-foreground">Loading your savings…</div>
      </Card>
    );
  }

  if (!summary || summary.orderCount === 0) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-light text-brand">
          <PiggyBank size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Start saving today</div>
          <div className="text-xs text-muted-foreground">
            We track every shilling you save vs. average prices.
          </div>
        </div>
        <Button
          size="sm"
          className="bg-brand text-white hover:bg-brand-dark"
          onClick={() => onNavigate("basket")}
        >
          Shop
        </Button>
      </Card>
    );
  }

  const TrendIcon =
    summary.avgSavingsPct >= 5 ? ArrowDownRight : summary.avgSavingsPct > 0 ? Minus : ArrowUpRight;

  return (
    <button
      onClick={() => onNavigate("savings")}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-4 text-left text-white transition-transform hover:scale-[1.01]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
        <PiggyBank size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-white/80">
          <TrendIcon size={12} /> You&apos;ve saved
        </div>
        <div className="text-2xl font-extrabold leading-tight">
          {KES(summary.totalSaved)}
        </div>
        <div className="text-[11px] text-white/70">
          across {summary.orderCount} order{summary.orderCount !== 1 ? "s" : ""} ·{" "}
          {summary.avgSavingsPct}% below market
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold text-gold">
        View →
      </span>
    </button>
  );
}
