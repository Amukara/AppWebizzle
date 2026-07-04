"use client";

import * as React from "react";
import {
  Lock,
  Settings,
  Loader2,
  RefreshCw,
  LogOut,
  Package,
  Truck,
  Store,
  Rocket,
  Receipt,
  LayoutDashboard,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  ImageOff,
  Pause,
  Play,
  Database,
  ArrowUpFromLine,
  Wifi,
  WifiOff,
  Bike,
  Hash,
  User,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KES } from "../logo";
import { StatusPill } from "../ui";
import type {
  AdminDashboard,
  AdminOrder,
  AdminDispatch,
  AdminVendorApp,
  AdminRiderApp,
  AdminBoost,
  AdminReceipt,
  AdminPresence,
} from "@/lib/types";

// ---------- fetch helper ----------
// Auth uses BOTH an httpOnly cookie (for first-party/direct-nav contexts) AND
// a bearer-style `x-admin-token` header (for third-party iframe contexts like
// the preview panel, where SameSite cookies are blocked). The token lives in
// sessionStorage and is attached to every admin fetch.
const TOKEN_KEY = "wb_admin_token";
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function adminFetch<T>(
  url: string,
  init?: RequestInit,
  onUnauthorized?: () => void
): Promise<T> {
  const token = getToken();
  const doFetch = () =>
    fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-admin-token": token } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      credentials: "same-origin",
    });

  let res = await doFetch();
  if (res.status === 401) {
    // Transient cookie-commit race: retry once after a brief delay.
    await new Promise((r) => setTimeout(r, 500));
    res = await doFetch();
  }
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

// ---------- small UI atoms ----------
function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "brand" | "gold" | "mpesa" | "muted";
  icon?: React.ReactNode;
}) {
  const accentMap: Record<string, string> = {
    brand: "bg-brand-light text-brand",
    gold: "bg-gold/15 text-gold-dark",
    mpesa: "bg-mpesa/10 text-mpesa",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 truncate text-xl font-bold text-foreground sm:text-2xl">
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          {icon && (
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                accentMap[accent]
              )}
            >
              {icon}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

function EmptyState({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

// Order status advance options. CONFIRMED -> DISPATCHED -> DELIVERED.
const ORDER_ADVANCE: { value: string; label: string }[] = [
  { value: "CONFIRMED", label: "Confirm order" },
  { value: "DISPATCHED", label: "Mark dispatched" },
  { value: "DELIVERED", label: "Mark delivered" },
];

// ---------- Login gate ----------
function LoginGate({
  onLogin,
  error,
  submitting,
}: {
  onLogin: (username: string, password: string) => void;
  error: string | null;
  submitting: boolean;
}) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
            <Lock size={24} />
          </span>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">Operator sign-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Restricted area. Sign in with your operator credentials.
            </p>
          </div>
          <form
            className="flex w-full flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              onLogin(username, password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-user" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="admin-user"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-pass2" className="text-xs font-medium">
                Password
              </Label>
              <Input
                id="admin-pass2"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              className="bg-brand text-white hover:bg-brand-dark"
              disabled={submitting || !username || !password}
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Lock size={16} />
              )}
              Sign in
            </Button>
          </form>
          <p className="text-center text-[11px] text-muted-foreground">
            Access is granted per operator. Contact your supervisor if you need
            credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Presence (online vendors + riders) ----------
function PresenceSection() {
  const [data, setData] = React.useState<AdminPresence | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await adminFetch<AdminPresence>("/api/admin/presence");
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Live presence
        </h3>
        {data && (
          <span className="text-xs text-muted-foreground">
            <span className="font-bold text-brand">{data.summary.vendorsOnline}</span> vendors ·{" "}
            <span className="font-bold text-brand">{data.summary.ridersOnline}</span> riders online
          </span>
        )}
      </div>
      {loading && !data ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={14} /> Loading presence…
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Could not load presence.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Vendors */}
          <Card>
            <CardContent className="p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Vendors ({data.summary.vendorsOnline}/{data.summary.vendorsTotal} online)
              </h4>
              {data.vendors.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vendor profiles yet.</p>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto wb-scroll">
                  {data.vendors.map((v) => (
                    <div
                      key={v.vendorId}
                      className="flex items-center gap-2 rounded-lg border border-border p-2"
                    >
                      <span
                        className={
                          "h-2.5 w-2.5 shrink-0 rounded-full " +
                          (v.isOnline ? "bg-brand animate-pulse" : "bg-muted-foreground/30")
                        }
                      />
                      <span className="text-lg">{v.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{v.shopName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {v.type} · duty {v.dutyStart}–{v.dutyEnd}
                        </div>
                      </div>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                          (v.isOnline
                            ? "bg-brand-light text-brand"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {v.isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Riders */}
          <Card>
            <CardContent className="p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Riders ({data.summary.ridersOnline}/{data.summary.ridersTotal} online)
              </h4>
              {data.riders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rider profiles yet.</p>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto wb-scroll">
                  {data.riders.map((r) => (
                    <div
                      key={r.riderKey}
                      className="flex items-center gap-2 rounded-lg border border-border p-2"
                    >
                      <span
                        className={
                          "h-2.5 w-2.5 shrink-0 rounded-full " +
                          (r.isOnline ? "bg-brand animate-pulse" : "bg-muted-foreground/30")
                        }
                      />
                      <span className="text-lg">🛵</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {r.fullName || "Rider"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-mono">{r.plate || "—"}</span> · {r.phone}
                        </div>
                      </div>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                          (r.isOnline
                            ? "bg-brand-light text-brand"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {r.isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

// ---------- Overview tab ----------
function OverviewTab({
  dashboard,
  loading,
  error,
}: {
  dashboard: AdminDashboard | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (!dashboard) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Revenue cards */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Revenue
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Platform fees"
            value={KES(dashboard.platformRevenue)}
            hint="3% levy on orders > KES 300"
            accent="brand"
            icon={<TrendingUp size={18} />}
          />
          <StatCard
            label="Driver levies"
            value={KES(dashboard.driverLevyRevenue)}
            hint="10% of delivery fees"
            accent="mpesa"
            icon={<Truck size={18} />}
          />
          <StatCard
            label="Boost revenue"
            value={KES(dashboard.boostRevenue)}
            hint={`${dashboard.activeBoosts} active campaign${
              dashboard.activeBoosts === 1 ? "" : "s"
            }`}
            accent="gold"
            icon={<Rocket size={18} />}
          />
          <StatCard
            label="GMV"
            value={KES(dashboard.grossMerchandiseValue)}
            hint={`Avg ${KES(dashboard.avgOrderValue)} / order`}
            accent="brand"
            icon={<Package size={18} />}
          />
        </div>
      </section>

      {/* Operations cards */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Operations
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total orders"
            value={String(dashboard.totalOrders)}
            accent="muted"
            icon={<Package size={18} />}
          />
          <StatCard
            label="Pending dispatch"
            value={String(dashboard.pendingDispatch)}
            hint="Confirmed, awaiting rider"
            accent="gold"
            icon={<Loader2 size={18} />}
          />
          <StatCard
            label="In transit"
            value={String(dashboard.inTransit)}
            hint="Out for delivery"
            accent="mpesa"
            icon={<Truck size={18} />}
          />
          <StatCard
            label="Delivered"
            value={String(dashboard.delivered)}
            accent="brand"
            icon={<CheckCircle2 size={18} />}
          />
        </div>
      </section>

      {/* Chart + top vendors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Orders · last 7 days
              </h3>
              <Badge variant="secondary" className="font-mono text-xs">
                {dashboard.ordersLast7Days.reduce(
                  (s, d) => s + d.count,
                  0
                )}{" "}
                orders
              </Badge>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboard.ordersLast7Days}
                  margin={{ top: 6, right: 8, left: -18, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border, #e5e7eb)"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--brand-light, #E6F4EE)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border, #e5e7eb)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value, "Orders"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--brand, #0B7A4F)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Top vendors
            </h3>
            {dashboard.topVendors.length === 0 ? (
              <EmptyState
                icon={<Store size={18} />}
                label="No vendor orders yet."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {dashboard.topVendors.map((v, i) => (
                  <li
                    key={v.vendorId}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-2xl leading-none">{v.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {v.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.orders} order{v.orders === 1 ? "" : "s"} · payout{" "}
                        <span className="font-medium text-foreground">
                          {KES(v.payout)}
                        </span>
                      </p>
                    </div>
                    <span className="text-right text-sm font-bold text-brand">
                      {KES(v.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral + receipt summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Referral signups
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.referralSignups}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.referralOrders} orders · {KES(dashboard.referralRewardsPaid)}{" "}
              rewards paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Receipts pending
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.receiptsPending}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.receiptsApproved} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tokens issued
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {dashboard.tokensIssued}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              From approved receipt uploads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live presence (online vendors + riders) */}
      <PresenceSection />
    </div>
  );
}

// ---------- Orders tab ----------
function OrdersTab({
  orders,
  loading,
  error,
  onAdvance,
  advancingId,
}: {
  orders: AdminOrder[];
  loading: boolean;
  error: string | null;
  onAdvance: (id: string, status: string) => void;
  advancingId: string | null;
}) {
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading orders…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (orders.length === 0) {
    return (
      <EmptyState icon={<Package size={18} />} label="No orders yet." />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          All orders ({orders.length})
        </h3>
      </div>
      <div className="max-h-[70vh] overflow-y-auto wb-scroll rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Order</th>
              <th className="px-3 py-2 font-semibold">Customer</th>
              <th className="px-3 py-2 font-semibold">Vendor</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-right font-semibold">Platform</th>
              <th className="px-3 py-2 text-right font-semibold">Driver levy</th>
              <th className="px-3 py-2 text-right font-semibold">Vendor pay</th>
              <th className="px-3 py-2 text-right font-semibold">Driver pay</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Advance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="align-top hover:bg-muted/40">
                <td className="px-3 py-2 font-mono text-xs font-semibold text-foreground">
                  {o.id.slice(-8).toUpperCase()}
                  <div className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("en-KE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">
                    {o.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span>{o.vendor.emoji}</span>
                    <span className="font-medium text-foreground">
                      {o.vendor.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-foreground">
                  {KES(o.total)}
                </td>
                <td className="px-3 py-2 text-right text-brand">
                  {KES(o.platformFee)}
                </td>
                <td className="px-3 py-2 text-right text-mpesa">
                  {KES(o.driverLevy)}
                </td>
                <td className="px-3 py-2 text-right text-foreground">
                  {KES(o.vendorPayout)}
                </td>
                <td className="px-3 py-2 text-right text-foreground">
                  {KES(o.driverPayout)}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-3 py-2">
                  <Select
                    value=""
                    onValueChange={(v) => {
                      if (v) onAdvance(o.id, v);
                    }}
                    disabled={
                      advancingId === o.id || o.status === "DELIVERED"
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 w-[150px] text-xs"
                      aria-label={`Advance order ${o.id.slice(-8).toUpperCase()}`}
                    >
                      <SelectValue
                        placeholder={
                          o.status === "DELIVERED"
                            ? "Delivered"
                            : "Advance status"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_ADVANCE.filter(
                        (opt) => opt.value !== o.status
                      ).map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          disabled={
                            (opt.value === "DELIVERED" &&
                              o.status !== "DISPATCHED") ||
                            (opt.value === "DISPATCHED" &&
                              o.status === "PLACED")
                          }
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Dispatches tab ----------
function DispatchesTab({
  dispatches,
  loading,
  error,
  onAdvance,
  advancingId,
}: {
  dispatches: AdminDispatch[];
  loading: boolean;
  error: string | null;
  onAdvance: (id: string, status: string) => void;
  advancingId: string | null;
}) {
  if (loading && dispatches.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading dispatches…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (dispatches.length === 0) {
    return (
      <EmptyState
        icon={<Truck size={18} />}
        label="No active dispatches right now."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">
        Active dispatches ({dispatches.length})
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {dispatches.map((d) => {
          const isConfirmed = d.status === "CONFIRMED";
          const isDispatched = d.status === "DISPATCHED";
          return (
            <Card key={d.orderId}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">
                      {d.vendorEmoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {d.vendorName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{d.orderId.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium text-foreground">
                      {d.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Order total</p>
                    <p className="font-semibold text-foreground">
                      {KES(d.total)}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-start gap-1.5">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-muted-foreground"
                    />
                    <p className="text-foreground">{d.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rider</p>
                    <p className="font-medium text-foreground">
                      {d.riderName ?? "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plate</p>
                    <p className="font-mono font-medium text-foreground">
                      {d.riderPlate ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rider earns</p>
                    <p className="font-semibold text-mpesa">
                      {KES(d.driverPayout)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Levy (10%)</p>
                    <p className="font-semibold text-brand">
                      {KES(d.driverLevy)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ETA</p>
                    <p className="font-medium text-foreground">
                      ~{d.etaMinutes} min
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {isConfirmed && (
                    <Button
                      size="sm"
                      className="flex-1 bg-brand text-white hover:bg-brand-dark"
                      disabled={advancingId === d.orderId}
                      onClick={() => onAdvance(d.orderId, "DISPATCHED")}
                    >
                      {advancingId === d.orderId ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Truck size={14} />
                      )}
                      Mark dispatched
                    </Button>
                  )}
                  {isDispatched && (
                    <Button
                      size="sm"
                      className="flex-1 bg-mpesa text-white hover:bg-mpesa/90"
                      disabled={advancingId === d.orderId}
                      onClick={() => onAdvance(d.orderId, "DELIVERED")}
                    >
                      {advancingId === d.orderId ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Mark delivered
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Vendor approvals tab ----------
function DocThumb({ dataUrl, alt }: { dataUrl: string | null; alt: string }) {
  if (!dataUrl) {
    return (
      <div
        className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground"
        title={`${alt}: not provided`}
        aria-label={`${alt}: not provided`}
      >
        <ImageOff size={14} />
      </div>
    );
  }
  return (
    <img
      src={dataUrl}
      alt={alt}
      className="size-12 rounded-md border border-border object-cover"
    />
  );
}

function VendorApprovalsTab({
  applications,
  loading,
  error,
  onDecide,
  decidingId,
}: {
  applications: AdminVendorApp[];
  loading: boolean;
  error: string | null;
  onDecide: (id: string, status: "APPROVED" | "REJECTED") => void;
  decidingId: string | null;
}) {
  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading applications…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<Store size={18} />}
        label="No vendor applications yet."
      />
    );
  }

  const pending = applications.filter((a) => a.status === "PENDING");
  const decided = applications.filter((a) => a.status !== "PENDING");
  const ordered = [...pending, ...decided];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">
        Vendor applications ({applications.length}) · {pending.length} pending
      </h3>
      <div className="max-h-[70vh] overflow-y-auto wb-scroll">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ordered.map((a) => {
            const isPending = a.status === "PENDING";
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {a.logo ? (
                        <img
                          src={a.logo}
                          alt={`${a.shopName} logo`}
                          className="size-12 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md bg-brand-light text-brand">
                          <Store size={20} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {a.shopName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.ownerName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone size={11} />
                          {a.phone}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={a.status} />
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Verification documents
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <DocThumb dataUrl={a.tradeLicense} alt="Trade licence" />
                        <span className="text-[10px] text-muted-foreground">
                          Trade
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <DocThumb
                          dataUrl={a.municipalLicense}
                          alt="Municipal licence"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Municipal
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <DocThumb dataUrl={a.kplcToken} alt="KPLC token" />
                        <span className="text-[10px] text-muted-foreground">
                          KPLC
                        </span>
                      </div>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-brand text-white hover:bg-brand-dark"
                        disabled={decidingId === a.id}
                        onClick={() => onDecide(a.id, "APPROVED")}
                      >
                        {decidingId === a.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        disabled={decidingId === a.id}
                        onClick={() => onDecide(a.id, "REJECTED")}
                      >
                        <XCircle size={14} />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Rider approvals tab ----------
function RiderApprovalsTab({
  applications,
  loading,
  error,
  onDecide,
  decidingId,
}: {
  applications: AdminRiderApp[];
  loading: boolean;
  error: string | null;
  onDecide: (id: string, status: "APPROVED" | "REJECTED") => void;
  decidingId: string | null;
}) {
  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading rider applications…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<Bike size={18} />}
        label="No rider applications yet."
      />
    );
  }

  const pending = applications.filter((a) => a.status === "PENDING");
  const decided = applications.filter((a) => a.status !== "PENDING");
  const ordered = [...pending, ...decided];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">
        Rider applications ({applications.length}) · {pending.length} pending
      </h3>
      <div className="max-h-[70vh] overflow-y-auto wb-scroll">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ordered.map((a) => {
            const isPending = a.status === "PENDING";
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {a.selfieUrl ? (
                        <img
                          src={a.selfieUrl}
                          alt={`${a.fullName} selfie`}
                          className="size-12 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-full bg-brand-light text-brand">
                          <User size={20} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {a.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Phone size={11} className="inline" /> {a.phone}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={a.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 font-medium text-muted-foreground">
                        <Bike size={10} /> Bike plate
                      </div>
                      <div className="mt-0.5 font-bold text-foreground">{a.bikePlate}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 font-medium text-muted-foreground">
                        <Hash size={10} /> Stage
                      </div>
                      <div className="mt-0.5 font-bold text-foreground">{a.stageNumber}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 font-medium text-muted-foreground">
                        <MapPin size={10} /> Area
                      </div>
                      <div className="mt-0.5 font-bold text-foreground">{a.locationArea}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Applied {new Date(a.createdAt).toLocaleDateString()}</span>
                    {!a.selfieUrl && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                        No selfie provided
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-brand text-white hover:bg-brand-dark"
                        disabled={decidingId === a.id}
                        onClick={() => onDecide(a.id, "APPROVED")}
                      >
                        {decidingId === a.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        disabled={decidingId === a.id}
                        onClick={() => onDecide(a.id, "REJECTED")}
                      >
                        <XCircle size={14} />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Boosts tab ----------
function BoostsTab({
  boosts,
  loading,
  error,
  onDecide,
  decidingId,
  totalRevenue,
}: {
  boosts: AdminBoost[];
  loading: boolean;
  error: string | null;
  onDecide: (id: string, status: "ACTIVE" | "PAUSED" | "EXPIRED") => void;
  decidingId: string | null;
  totalRevenue: number;
}) {
  if (loading && boosts.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading boosts…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (boosts.length === 0) {
    return (
      <EmptyState
        icon={<Rocket size={18} />}
        label="No boost campaigns yet."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Boost campaigns ({boosts.length})
        </h3>
        <Badge className="bg-gold/15 text-gold-dark">
          Total revenue: {KES(totalRevenue)}
        </Badge>
      </div>
      <div className="max-h-[70vh] overflow-y-auto wb-scroll">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {boosts.map((b) => {
            const isActive = b.status === "ACTIVE";
            const isPaused = b.status === "PAUSED";
            return (
              <Card key={b.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        {b.shopName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone size={11} />
                        {b.phone}
                      </p>
                    </div>
                    <Badge className="bg-gold text-white">{b.package}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-semibold text-foreground">
                        {KES(b.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <StatusPill status={b.status} />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Impressions</p>
                      <p className="font-medium text-foreground">
                        {b.impressions.toLocaleString("en-KE")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-medium text-foreground">
                        {b.clicks.toLocaleString("en-KE")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Run window</p>
                      <p className="font-medium text-foreground">
                        {new Date(b.startsAt).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        →{" "}
                        {new Date(b.endsAt).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={decidingId === b.id}
                        onClick={() => onDecide(b.id, "PAUSED")}
                      >
                        {decidingId === b.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Pause size={14} />
                        )}
                        Pause
                      </Button>
                    )}
                    {isPaused && (
                      <Button
                        size="sm"
                        className="flex-1 bg-brand text-white hover:bg-brand-dark"
                        disabled={decidingId === b.id}
                        onClick={() => onDecide(b.id, "ACTIVE")}
                      >
                        {decidingId === b.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                        Resume
                      </Button>
                    )}
                    {b.status === "EXPIRED" && (
                      <Badge
                        variant="secondary"
                        className="w-full justify-center py-1.5"
                      >
                        Expired
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Receipts tab ----------
function ReceiptsTab({
  receipts,
  loading,
  error,
  onDecide,
  decidingId,
}: {
  receipts: AdminReceipt[];
  loading: boolean;
  error: string | null;
  onDecide: (id: string, status: "APPROVED" | "REJECTED") => void;
  decidingId: string | null;
}) {
  if (loading && receipts.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">Loading receipts…</span>
      </div>
    );
  }
  if (error) return <SectionError message={error} />;
  if (receipts.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={18} />}
        label="No receipt submissions yet."
      />
    );
  }

  const pending = receipts.filter((r) => r.status === "PENDING");
  const decided = receipts.filter((r) => r.status !== "PENDING");
  const ordered = [...pending, ...decided];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">
        Receipt submissions ({receipts.length}) · {pending.length} pending
      </h3>
      <div className="max-h-[70vh] overflow-y-auto wb-scroll">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((r) => {
            const isPending = r.status === "PENDING";
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Customer phone
                      </p>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {r.customerPhone}
                      </p>
                    </div>
                    <StatusPill status={r.status} />
                  </div>

                  <div className="overflow-hidden rounded-md border border-border bg-muted/40">
                    <img
                      src={r.receiptUrl}
                      alt={`Receipt from ${r.retailerName ?? "unknown retailer"}`}
                      className="mx-auto max-h-40 w-auto object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Retailer (VLM)</p>
                      <p className="font-medium text-foreground">
                        {r.retailerName ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Extracted total</p>
                      <p className="font-semibold text-foreground">
                        {KES(r.extractedTotal)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Receipt date</p>
                      <p className="font-medium text-foreground">
                        {r.receiptDate
                          ? new Date(r.receiptDate).toLocaleDateString("en-KE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Tokens</p>
                      <p className="font-semibold text-brand">
                        {r.tokensAwarded} tokens
                      </p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-brand text-white hover:bg-brand-dark"
                        disabled={decidingId === r.id}
                        onClick={() => onDecide(r.id, "APPROVED")}
                      >
                        {decidingId === r.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Approve (+10 tokens)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        disabled={decidingId === r.id}
                        onClick={() => onDecide(r.id, "REJECTED")}
                      >
                        <XCircle size={14} />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Airtable Sync Tab ----------
function AirtableTab() {
  const [connected, setConnected] = React.useState<boolean | null>(null);
  const [baseName, setBaseName] = React.useState<string>("");
  const [syncing, setSyncing] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Record<string, { synced: number; created: number }>>({});
  const [error, setError] = React.useState<string | null>(null);

  const checkConnection = React.useCallback(async () => {
    try {
      const res = await fetch("/api/airtable/status");
      const data = await res.json();
      setConnected(data.connected);
      if (data.tables?.length) setBaseName(data.tables.join(", "));
      else if (data.message) setBaseName(data.message);
      if (!data.connected) setError(data.error ?? "Connection failed");
      else setError(null);
    } catch {
      setConnected(false);
      setError("Could not reach Airtable API");
    }
  }, []);

  React.useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const sync = async (key: string, endpoint: string) => {
    setSyncing(key);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResults((prev) => ({ ...prev, [key]: { synced: data.synced, created: data.created } }));
      } else {
        setError(data.error ?? "Sync failed");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSyncing(null);
    }
  };

  const syncAll = async () => {
    setSyncing("all");
    setError(null);
    const endpoints = [
      ["orders", "/api/airtable/sync-orders"],
      ["vendors", "/api/airtable/sync-vendors"],
      ["products", "/api/airtable/sync-products"],
    ] as const;
    for (const [key, endpoint] of endpoints) {
      try {
        const res = await fetch(endpoint, { method: "POST" });
        const data = await res.json();
        if (data.success) {
          setResults((prev) => ({ ...prev, [key]: { synced: data.synced, created: data.created } }));
        } else {
          setError(data.error ?? `${key} sync failed`);
        }
      } catch {
        setError(`Failed to sync ${key}`);
      }
    }
    setSyncing(null);
  };

  const cards: { key: string; label: string; emoji: string; desc: string; endpoint: string; color: string }[] = [
    { key: "orders", label: "Orders", emoji: "📦", desc: "Customer orders, items, status, M-Pesa codes, rider info, fees", endpoint: "/api/airtable/sync-orders", color: "border-blue-200 bg-blue-50/50" },
    { key: "vendors", label: "Vendors", emoji: "🏪", desc: "Vendor names, types, ratings, delivery fees, ETAs, locations", endpoint: "/api/airtable/sync-vendors", color: "border-amber-200 bg-amber-50/50" },
    { key: "products", label: "Products", emoji: "🏷️", desc: "Product catalogue with categories, base prices, vendor counts", endpoint: "/api/airtable/sync-products", color: "border-green-200 bg-green-50/50" },
  ];

  return (
    <div className="space-y-5">
      {/* Connection status banner */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        connected === true
          ? "border-green-200 bg-green-50"
          : connected === false
            ? "border-red-200 bg-red-50"
            : "border-border bg-muted/30"
      )}>
        {connected === null ? (
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        ) : connected ? (
          <Wifi size={20} className="text-green-600" />
        ) : (
          <WifiOff size={20} className="text-red-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className={cn(
            "text-sm font-semibold",
            connected === true ? "text-green-800" : connected === false ? "text-red-700" : "text-muted-foreground"
          )}>
            {connected === null ? "Checking connection…" : connected ? `Connected to Airtable${baseName ? ` — ${baseName}` : ""}` : "Not connected"}
          </div>
          <div className="text-xs text-muted-foreground">
            {connected === true
              ? "Your base is reachable. Sync data below."
              : connected === false
                ? error ?? "Check your Airtable token and base ID in .env.local"
                : "Testing connection to your Airtable base…"}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={checkConnection} disabled={connected === null}>
          <RefreshCw size={13} className={cn(connected === null && "animate-spin")} />
          Test
        </Button>
      </div>

      {/* Sync All CTA */}
      <Card className={cn("border-brand/30 p-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Database size={18} className="text-brand" />
              <h3 className="font-bold">Sync all data to Airtable</h3>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Push all orders, vendors, and products to your Airtable base. Each sync replaces the previous data.
            </p>
          </div>
          <Button
            className="bg-brand text-white hover:bg-brand-dark shrink-0"
            disabled={!connected || !!syncing}
            onClick={syncAll}
          >
            {syncing === "all" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowUpFromLine size={16} />
            )}
            Sync All
          </Button>
        </div>
      </Card>

      {/* Per-table sync cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => {
          const r = results[c.key];
          const isSyncing = syncing === c.key || syncing === "all";
          return (
            <Card key={c.key} className={cn("p-4", c.color)}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{c.emoji}</span>
                {r && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    <CheckCircle2 size={10} /> {r.synced} rows
                  </span>
                )}
              </div>
              <h4 className="mt-2 text-sm font-bold">{c.label}</h4>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{c.desc}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                disabled={!connected || !!syncing}
                onClick={() => sync(c.key, c.endpoint)}
              >
                {isSyncing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowUpFromLine size={14} />
                )}
                Sync {c.label}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Info note */}
      <div className="rounded-xl bg-muted/60 p-3 text-center text-[11px] text-muted-foreground">
        <Database size={12} className="mr-1 inline text-brand" />
        Airtable syncs are one-way (WeBizzle → Airtable). New orders are also auto-pushed when placed.
        <br />
        Each full sync replaces all rows in the target table to keep data in sync.
      </div>

      {error && !connected && (
        <SectionError message={error} />
      )}
    </div>
  );
}

// ---------- Settings Tab ----------
function SettingsTab() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const strength = React.useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score; // 0–5
  }, [newPassword]);

  const strengthLabel = React.useMemo(() => {
    if (strength <= 1) return { text: "Weak", color: "text-red-500", bg: "bg-red-500" };
    if (strength <= 2) return { text: "Fair", color: "text-amber-500", bg: "bg-amber-500" };
    if (strength <= 3) return { text: "Good", color: "text-blue-500", bg: "bg-blue-500" };
    return { text: "Strong", color: "text-green-600", bg: "bg-green-500" };
  }, [strength]);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !loading;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password.");
        return;
      }
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-brand" />
          <h3 className="text-base font-bold">Change password</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Update your admin account password. You will need to use the new password next time you sign in.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        {/* Current password */}
        <div className="space-y-1.5">
          <Label htmlFor="current-pw">Current password</Label>
          <div className="relative">
            <Input
              id="current-pw"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="new-pw">New password</Label>
          <div className="relative">
            <Input
              id="new-pw"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? "Hide" : "Show"}
            </button>
          </div>
          {/* Strength meter */}
          {newPassword.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i <= strength ? strengthLabel.bg : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className={cn("text-[11px] font-medium", strengthLabel.color)}>
                {strengthLabel.text}
              </p>
            </div>
          )}
        </div>

        {/* Confirm new password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Confirm new password</Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}
          {confirmPassword.length > 0 && newPassword === confirmPassword && (
            <p className="text-xs text-green-600">Passwords match.</p>
          )}
        </div>

        {/* Submit */}
        <Button
          className="w-full bg-brand text-white hover:bg-brand-dark"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Changing password…
            </>
          ) : (
            <>
              <Lock size={16} />
              Change password
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-center text-xs text-green-700">
            {success}
          </div>
        )}
      </Card>

      {/* Security tips */}
      <div className="rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
        <Lock size={12} className="mr-1 inline text-brand" />
        <strong>Security tips:</strong> Use a mix of uppercase, lowercase, numbers, and symbols. 
        Avoid reusing passwords from other services. Change your password regularly.
      </div>
    </div>
  );
}

// ---------- Main component ----------
export function AdminPage() {
  // `authed` is a boolean mirror of the server-side cookie session. The cookie
  // itself is httpOnly and never readable by JS — this flag just controls UI.
  const [authed, setAuthed] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState<{ username: string; role: string } | null>(null);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [gateError, setGateError] = React.useState<string | null>(null);
  const [gateSubmitting, setGateSubmitting] = React.useState(false);

  const [dashboard, setDashboard] = React.useState<AdminDashboard | null>(null);
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [dispatches, setDispatches] = React.useState<AdminDispatch[]>([]);
  const [applications, setApplications] = React.useState<AdminVendorApp[]>([]);
  const [riderApps, setRiderApps] = React.useState<AdminRiderApp[]>([]);
  const [boosts, setBoosts] = React.useState<AdminBoost[]>([]);
  const [receipts, setReceipts] = React.useState<AdminReceipt[]>([]);

  const [loadingDashboard, setLoadingDashboard] = React.useState(false);
  const [loadingOrders, setLoadingOrders] = React.useState(false);
  const [loadingDispatches, setLoadingDispatches] = React.useState(false);
  const [loadingApplications, setLoadingApplications] = React.useState(false);
  const [loadingRiderApps, setLoadingRiderApps] = React.useState(false);
  const [loadingBoosts, setLoadingBoosts] = React.useState(false);
  const [loadingReceipts, setLoadingReceipts] = React.useState(false);

  const [dashboardError, setDashboardError] = React.useState<string | null>(
    null
  );
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [dispatchesError, setDispatchesError] = React.useState<string | null>(
    null
  );
  const [applicationsError, setApplicationsError] = React.useState<
    string | null
  >(null);
  const [riderAppsError, setRiderAppsError] = React.useState<string | null>(null);
  const [boostsError, setBoostsError] = React.useState<string | null>(null);
  const [receiptsError, setReceiptsError] = React.useState<string | null>(null);

  const [advancingId, setAdvancingId] = React.useState<string | null>(null);
  const [decidingId, setDecidingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // ---- auth helpers ----
  const clearAuth = React.useCallback(() => {
    setAuthed(false);
    setAdminUser(null);
    setGateError("Your session has expired. Please sign in again.");
  }, []);

  // On mount, ask the server if there's already a live session (cookie OR
  // token header). This is what makes the session survive a page refresh.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch("/api/admin/session", {
          credentials: "same-origin",
          headers: token ? { "x-admin-token": token } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (alive && data.authed) {
            setAuthed(true);
            setAdminUser(data.admin);
          }
        }
      } catch {
        // ignore — treat as not authed
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleLogin = React.useCallback(
    async (username: string, password: string) => {
      setGateSubmitting(true);
      setGateError(null);
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setGateError(data.error || "Invalid username or password.");
          return;
        }
        // Persist the token so adminFetch can send it as a header. This works
        // in third-party iframes (where the httpOnly cookie may be blocked)
        // as well as in direct-nav/curl contexts (where the cookie works).
        if (data.token) setToken(data.token);
        setAdminUser(data.admin);
        setAuthed(true);
      } catch {
        setGateError("Could not reach the server. Try again.");
      } finally {
        setGateSubmitting(false);
      }
    },
    []
  );

  const handleLogout = React.useCallback(async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: getToken() ? { "x-admin-token": getToken()! } : {},
      });
    } catch {
      // ignore — clear client state regardless
    }
    setToken(null);
    setAuthed(false);
    setAdminUser(null);
    setGateError(null);
  }, []);

  // ---- loaders ----
  const loadDashboard = React.useCallback(async () => {
    if (!authed) return;
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const data = await adminFetch<AdminDashboard>(
        "/api/admin/dashboard",
        undefined,
        clearAuth
      );
      setDashboard(data);
    } catch (err) {
      setDashboardError(
        err instanceof Error ? err.message : "Failed to load analytics."
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, [authed, clearAuth]);

  const loadOrders = React.useCallback(async () => {
    if (!authed) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await adminFetch<{ orders: AdminOrder[] }>(
        "/api/admin/orders",
        undefined,
        clearAuth
      );
      setOrders(data.orders);
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Failed to load orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  }, [authed, clearAuth]);

  const loadDispatches = React.useCallback(async () => {
    if (!authed) return;
    setLoadingDispatches(true);
    setDispatchesError(null);
    try {
      const data = await adminFetch<{ dispatches: AdminDispatch[] }>(
        "/api/admin/dispatches",
        undefined,
        clearAuth
      );
      setDispatches(data.dispatches);
    } catch (err) {
      setDispatchesError(
        err instanceof Error ? err.message : "Failed to load dispatches."
      );
    } finally {
      setLoadingDispatches(false);
    }
  }, [authed, clearAuth]);

  const loadApplications = React.useCallback(async () => {
    if (!authed) return;
    setLoadingApplications(true);
    setLoadingRiderApps(true);
    setApplicationsError(null);
    setRiderAppsError(null);
    try {
      const data = await adminFetch<{ applications: AdminVendorApp[]; riderApplications: AdminRiderApp[] }>(
        "/api/admin/applications",
        undefined,
        clearAuth
      );
      setApplications(data.applications);
      setRiderApps(data.riderApplications ?? []);
    } catch (err) {
      setApplicationsError(
        err instanceof Error ? err.message : "Failed to load applications."
      );
      setRiderAppsError(
        err instanceof Error ? err.message : "Failed to load rider applications."
      );
    } finally {
      setLoadingApplications(false);
      setLoadingRiderApps(false);
    }
  }, [authed, clearAuth]);

  const loadBoosts = React.useCallback(async () => {
    if (!authed) return;
    setLoadingBoosts(true);
    setBoostsError(null);
    try {
      const data = await adminFetch<{ boosts: AdminBoost[] }>(
        "/api/admin/boosts",
        undefined,
        clearAuth
      );
      setBoosts(data.boosts);
    } catch (err) {
      setBoostsError(
        err instanceof Error ? err.message : "Failed to load boosts."
      );
    } finally {
      setLoadingBoosts(false);
    }
  }, [authed, clearAuth]);

  const loadReceipts = React.useCallback(async () => {
    if (!authed) return;
    setLoadingReceipts(true);
    setReceiptsError(null);
    try {
      const data = await adminFetch<{ receipts: AdminReceipt[] }>(
        "/api/admin/receipts",
        undefined,
        clearAuth
      );
      setReceipts(data.receipts);
    } catch (err) {
      setReceiptsError(
        err instanceof Error ? err.message : "Failed to load receipts."
      );
    } finally {
      setLoadingReceipts(false);
    }
  }, [authed, clearAuth]);

  const loadAll = React.useCallback(async () => {
    await Promise.all([
      loadDashboard(),
      loadOrders(),
      loadDispatches(),
      loadApplications(),
      loadBoosts(),
      loadReceipts(),
    ]);
  }, [
    loadDashboard,
    loadOrders,
    loadDispatches,
    loadApplications,
    loadBoosts,
    loadReceipts,
  ]);

  // Load everything once authed.
  React.useEffect(() => {
    if (!authed) return;
    void loadAll();
  }, [authed, loadAll]);

  // Poll dispatches every 10s while authed.
  React.useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => {
      void loadDispatches();
    }, 10000);
    return () => clearInterval(t);
  }, [authed, loadDispatches]);

  // ---- mutations ----
  const advanceOrder = React.useCallback(
    async (id: string, status: string) => {
      if (!authed) return;
      setAdvancingId(id);
      try {
        await adminFetch(
          "/api/admin/orders",
          {
            method: "PATCH",
            body: JSON.stringify({ id, status }),
          },
          clearAuth
        );
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status } : o))
        );
        await Promise.all([loadOrders(), loadDispatches(), loadDashboard()]);
      } catch {
        // best-effort: ignore
      } finally {
        setAdvancingId(null);
      }
    },
    [authed, clearAuth, loadOrders, loadDispatches, loadDashboard]
  );

  const decideApplication = React.useCallback(
    async (id: string, status: "APPROVED" | "REJECTED", kind?: "vendor" | "rider") => {
      if (!authed) return;
      setDecidingId(id);
      try {
        await adminFetch(
          "/api/admin/applications",
          {
            method: "PATCH",
            body: JSON.stringify({ id, status, kind }),
          },
          clearAuth
        );
        if (kind === "rider") {
          setRiderApps((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a))
          );
        } else {
          setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a))
          );
        }
        await loadDashboard();
      } finally {
        setDecidingId(null);
      }
    },
    [authed, clearAuth, loadDashboard]
  );

  const decideBoost = React.useCallback(
    async (id: string, status: "ACTIVE" | "PAUSED" | "EXPIRED") => {
      if (!authed) return;
      setDecidingId(id);
      try {
        await adminFetch(
          "/api/admin/boosts",
          {
            method: "PATCH",
            body: JSON.stringify({ id, status }),
          },
          clearAuth
        );
        setBoosts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        );
      } finally {
        setDecidingId(null);
      }
    },
    [authed, clearAuth]
  );

  const decideReceipt = React.useCallback(
    async (id: string, status: "APPROVED" | "REJECTED") => {
      if (!authed) return;
      setDecidingId(id);
      try {
        const res = await adminFetch<{ tokensAwarded: number }>(
          "/api/admin/receipts",
          {
            method: "PATCH",
            body: JSON.stringify({ id, status }),
          },
          clearAuth
        );
        setReceipts((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status, tokensAwarded: res.tokensAwarded ?? 0 }
              : r
          )
        );
        await loadDashboard();
      } finally {
        setDecidingId(null);
      }
    },
    [authed, clearAuth, loadDashboard]
  );

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  // ---- render ----
  if (bootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        Checking your session…
      </div>
    );
  }

  if (!authed) {
    return (
      <LoginGate
        onLogin={handleLogin}
        error={gateError}
        submitting={gateSubmitting}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand text-white">
            <LayoutDashboard size={20} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl">
              Operator dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Signed in as{" "}
              <span className="font-semibold text-foreground">
                {adminUser?.username ?? "admin"}
              </span>
              {adminUser?.role ? ` · ${adminUser.role}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard size={14} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <Package size={14} />
            Orders
          </TabsTrigger>
          <TabsTrigger value="dispatches" className="gap-1.5">
            <Truck size={14} />
            Dispatches
            {dispatches.length > 0 && (
              <Badge className="ml-1 bg-brand text-white" variant="secondary">
                {dispatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5">
            <Store size={14} />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="rider-applications" className="gap-1.5">
            <Bike size={14} />
            Riders
            {riderApps.filter((a) => a.status === "PENDING").length > 0 && (
              <Badge className="ml-1 bg-brand text-white" variant="secondary">
                {riderApps.filter((a) => a.status === "PENDING").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="boosts" className="gap-1.5">
            <Rocket size={14} />
            Boosts
          </TabsTrigger>
          <TabsTrigger value="receipts" className="gap-1.5">
            <Receipt size={14} />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="airtable" className="gap-1.5">
            <Database size={14} />
            Airtable
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings size={14} />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            dashboard={dashboard}
            loading={loadingDashboard}
            error={dashboardError}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <OrdersTab
            orders={orders}
            loading={loadingOrders}
            error={ordersError}
            onAdvance={advanceOrder}
            advancingId={advancingId}
          />
        </TabsContent>

        <TabsContent value="dispatches" className="mt-4">
          <DispatchesTab
            dispatches={dispatches}
            loading={loadingDispatches}
            error={dispatchesError}
            onAdvance={advanceOrder}
            advancingId={advancingId}
          />
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <VendorApprovalsTab
            applications={applications}
            loading={loadingApplications}
            error={applicationsError}
            onDecide={(id, status) => decideApplication(id, status, "vendor")}
            decidingId={decidingId}
          />
        </TabsContent>

        <TabsContent value="rider-applications" className="mt-4">
          <RiderApprovalsTab
            applications={riderApps}
            loading={loadingRiderApps}
            error={riderAppsError}
            onDecide={(id, status) => decideApplication(id, status, "rider")}
            decidingId={decidingId}
          />
        </TabsContent>

        <TabsContent value="boosts" className="mt-4">
          <BoostsTab
            boosts={boosts}
            loading={loadingBoosts}
            error={boostsError}
            onDecide={decideBoost}
            decidingId={decidingId}
            totalRevenue={dashboard?.boostRevenue ?? 0}
          />
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <ReceiptsTab
            receipts={receipts}
            loading={loadingReceipts}
            error={receiptsError}
            onDecide={decideReceipt}
            decidingId={decidingId}
          />
        </TabsContent>

        <TabsContent value="airtable" className="mt-4">
          <AirtableTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPage;
