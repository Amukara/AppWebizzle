"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bike,
  CheckCheck,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Star,
  Truck,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { KES } from "../logo";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import { OtpLoginGate } from "../ui/otp-login-gate";
import type { AppNotification, Order, RiderPortal } from "@/lib/types";

// Seeded rider pool — kept in sync with src/lib/pricing.ts RIDERS so the portal
// can show the rating (the RiderPortal type doesn't carry a rating field).
const SEEDED_RIDERS: {
  phone: string;
  name: string;
  plate: string;
  rating: number;
}[] = [
  { phone: "0711224118", name: "Peter Mutua", plate: "KMEA 224B", rating: 4.8 },
  { phone: "0722902553", name: "Brian Otieno", plate: "KMEB 902X", rating: 4.7 },
  { phone: "0701771209", name: "Faith Wanjiru", plate: "KMFC 771A", rating: 4.9 },
  { phone: "0733550441", name: "Samuel Kiptoo", plate: "KMDD 550C", rating: 4.6 },
  { phone: "0790318776", name: "Grace Auma", plate: "KMLG 318P", rating: 4.8 },
];

// Hint list shown on the login gate (with spaces, as a customer would read them).
const SEEDED_PHONE_HINTS = [
  "0711 224 118",
  "0722 902 553",
  "0701 771 209",
  "0733 550 441",
  "0790 318 776",
];

function normPhone(s: string): string {
  return (s || "").replace(/\s+/g, "");
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function statusPillClass(status: string): string {
  switch ((status || "").toUpperCase()) {
    case "DELIVERED":
      return "bg-brand-light text-brand";
    case "DISPATCHED":
      return "bg-gold/15 text-gold";
    case "CONFIRMED":
      return "bg-amber-100 text-amber-800";
    case "PLACED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Normalise a raw socket "notification" payload (which may be the AppNotification
// shape OR the leaner {type, orderId, customerName, total, at} shape the realtime
// service emits) into an AppNotification-shaped object.
function normalizeSocketNotif(
  raw: unknown,
  riderKey: string
): AppNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  const at = (n.at as string) || (n.createdAt as string) || new Date().toISOString();
  const type = (n.type as string) || "SYSTEM";
  const id =
    (n.id as string) || `socket-${at}-${type}-${(n.orderId as string) || ""}`;
  const title =
    (n.title as string) ||
    (type === "NEW_ORDER" ? "New order 🛒" : type === "DISPATCH" ? "Dispatch alert 🛵" : "New alert");
  const body =
    (n.body as string) ||
    (n.customerName && typeof n.total === "number"
      ? `${n.customerName} · KES ${Number(n.total).toLocaleString("en-KE")}`
      : "");
  return {
    id,
    recipientType: "RIDER",
    recipientId: riderKey,
    type,
    title,
    body,
    read: false,
    orderId: (n.orderId as string) || null,
    createdAt: at,
  };
}

export function RiderPortalPage({
  onNavigate,
}: {
  onNavigate: (p: "home" | "basket") => void;
}) {
  const { toast } = useToast();

  // Login state — phone + OTP
  const [portalToken, setPortalTokenState] = useState<string | null>(null);
  const [riderKey, setRiderKey] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Portal + data
  const [portal, setPortal] = useState<RiderPortal | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serverNotifications, setServerNotifications] = useState<AppNotification[]>(
    []
  );

  // Editable profile fields
  const [plateDraft, setPlateDraft] = useState("");
  const [savingPlate, setSavingPlate] = useState(false);

  // Online toggle in-flight
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Realtime presence — only register when the rider is online.
  const me = useMemo(() => {
    if (!riderKey || !portal?.isOnline) return null;
    return {
      kind: "rider" as const,
      id: riderKey,
      name: portal.fullName || riderKey,
    };
  }, [riderKey, portal?.isOnline, portal?.fullName]);
  const { connected, presence, notifications: socketNotifications } =
    useRealtime(me);

  // ---- OTP Login ----
  const handleOtpVerified = useCallback(async (phone: string, token: string) => {
    // Use original phone format (07xx) as riderKey to match seeded rider data
    const key = phone.replace(/\s/g, "");
    setPortalTokenState(token);
    setLoadingPortal(true);
    setPortalError(null);
    try {
      const res = await fetch(
        `/api/portal/rider?riderKey=${encodeURIComponent(key)}`,
        { headers: { "x-portal-token": token } }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as { portal: RiderPortal };
      setPortal(data.portal);
      setPlateDraft(data.portal.plate || "");
      setRiderKey(key);
      toast({
        title: `Karibu, ${data.portal.fullName || "rider"}!`,
        description: "You're signed in to the rider portal.",
      });
    } catch (e) {
      setPortalError(
        e instanceof Error ? e.message : "Could not load rider portal."
      );
      setPortalTokenState(null);
    } finally {
      setLoadingPortal(false);
    }
  }, [toast]);

  const handleSignOut = useCallback(() => {
    setRiderKey("");
    setPortal(null);
    setOrders([]);
    setServerNotifications([]);
    setPortalError(null);
    setPortalTokenState(null);
  }, []);

  // ---- Loaders ----
  const loadPortal = useCallback(async (key: string) => {
    try {
      const res = await fetch(
        `/api/portal/rider?riderKey=${encodeURIComponent(key)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as { portal: RiderPortal };
      setPortal(data.portal);
      setPlateDraft(data.portal.plate || "");
    } catch {
      // best-effort
    }
  }, []);

  const loadNotifications = useCallback(async (key: string) => {
    try {
      const res = await fetch(
        `/api/notifications?recipientType=RIDER&recipientId=${encodeURIComponent(
          key
        )}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: AppNotification[] };
      setServerNotifications(data.notifications);
    } catch {
      // best-effort
    }
  }, []);

  const loadOrders = useCallback(async (portalPhone: string) => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) return;
      const data = (await res.json()) as { orders: Order[] };
      const target = normPhone(portalPhone);
      const mine = data.orders.filter(
        (o) => o.rider && normPhone(o.rider.phone) === target
      );
      setOrders(mine);
    } catch {
      // best-effort
    }
  }, []);

  // Initial pull right after login.
  useEffect(() => {
    if (!riderKey || !portal) return;
    void loadNotifications(riderKey);
    void loadOrders(portal.phone);
  }, [riderKey, portal, loadNotifications, loadOrders]);

  // Poll notifications + assigned deliveries every 15s.
  useEffect(() => {
    if (!riderKey || !portal) return;
    const id = setInterval(() => {
      void loadNotifications(riderKey);
      void loadOrders(portal.phone);
    }, 15000);
    return () => clearInterval(id);
  }, [riderKey, portal, loadNotifications, loadOrders]);

  // ---- Online/offline toggle ----
  const toggleOnline = useCallback(
    async (next: boolean) => {
      if (!riderKey || !portal) return;
      setTogglingOnline(true);
      // Optimistic flip
      setPortal({ ...portal, isOnline: next });
      try {
        const headers: Record<string, string> = { "content-type": "application/json" };
        const token = portalTokenState;
        if (token) headers["x-portal-token"] = token;
        const res = await fetch("/api/portal/rider", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ riderKey, isOnline: next }),
        });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as { portal: RiderPortal };
        setPortal(data.portal);
        toast({
          title: next ? "You're online 🛵" : "You're offline",
          description: next
            ? "Ready for dispatch — new orders will ping you."
            : "No new deliveries will be assigned.",
        });
      } catch {
        // Revert on failure
        setPortal({ ...portal, isOnline: !next });
        toast({
          title: "Could not update status",
          description: "Please try again.",
        });
      } finally {
        setTogglingOnline(false);
      }
    },
    [riderKey, portal, toast]
  );

  // ---- Save plate on blur ----
  const savePlate = useCallback(async () => {
    if (!riderKey || !portal) return;
    const trimmed = plateDraft.trim().toUpperCase();
    if (trimmed === (portal.plate || "").toUpperCase()) return;
    setSavingPlate(true);
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      const token = portalTokenState;
      if (token) headers["x-portal-token"] = token;
      const res = await fetch("/api/portal/rider", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ riderKey, plate: trimmed }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = (await res.json()) as { portal: RiderPortal };
      setPortal(data.portal);
      setPlateDraft(data.portal.plate || "");
      toast({
        title: "Plate updated",
        description: trimmed || "Plate cleared",
      });
    } catch {
      toast({
        title: "Could not save plate",
        description: "Please try again.",
      });
    } finally {
      setSavingPlate(false);
    }
  }, [riderKey, portal, plateDraft, toast]);

  // ---- Mark notification as read ----
  const markRead = useCallback((n: AppNotification) => {
    if (n.read) return;
    setServerNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
    );
    void fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    if (!riderKey) return;
    setServerNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    void fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipientType: "RIDER", recipientId: riderKey }),
    }).catch(() => {});
  }, [riderKey]);

  // ---- Socket notifications → toast on new arrivals ----
  const seenNotifIds = useRef<Set<string>>(new Set());

  // Seed the seen set from server notifications so persisted alerts (re-fetched
  // every 15s) never re-toast.
  useEffect(() => {
    for (const n of serverNotifications) seenNotifIds.current.add(n.id);
  }, [serverNotifications]);

  useEffect(() => {
    for (const raw of socketNotifications) {
      const norm = normalizeSocketNotif(raw, riderKey);
      if (!norm) continue;
      if (seenNotifIds.current.has(norm.id)) continue;
      seenNotifIds.current.add(norm.id);
      toast({ title: norm.title, description: norm.body || undefined });
    }
  }, [socketNotifications, riderKey, toast]);

  // ---- Derived data ----
  const rating = useMemo(() => {
    if (!riderKey) return null;
    const match = SEEDED_RIDERS.find((r) => r.phone === riderKey);
    return match ? match.rating : null;
  }, [riderKey]);

  const activeOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["PLACED", "CONFIRMED", "DISPATCHED"].includes(
          (o.status || "").toUpperCase()
        )
      ),
    [orders]
  );

  const earnedToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const cutoff = startOfDay.getTime();
    return orders
      .filter((o) => new Date(o.createdAt).getTime() >= cutoff)
      .reduce((s, o) => s + (o.driverPayout || 0), 0);
  }, [orders]);

  const totalEarnings = useMemo(
    () =>
      orders
        .filter((o) => (o.status || "").toUpperCase() === "DELIVERED")
        .reduce((s, o) => s + (o.driverPayout || 0), 0),
    [orders]
  );

  const unreadCount = serverNotifications.filter((n) => !n.read).length;

  // Merge server-persisted + socket-delivered notifications (deduped, newest first).
  const mergedNotifications = useMemo(() => {
    const map = new Map<string, AppNotification>();
    for (const n of serverNotifications) map.set(n.id, n);
    for (const raw of socketNotifications) {
      const norm = normalizeSocketNotif(raw, riderKey);
      if (!norm) continue;
      if (!map.has(norm.id)) map.set(norm.id, norm);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [serverNotifications, socketNotifications, riderKey]);

  // =================== Empty state: OTP login gate ===================
  if (!riderKey || !portal) {
    if (loadingPortal) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={28} />
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <OtpLoginGate
          kind="rider"
          icon={<Bike className="text-brand" size={26} />}
          title="Rider Portal"
          subtitle="Sign in with your phone to see assigned deliveries, live alerts, and earnings."
          placeholder="e.g. 0711 224 118"
          hint={`Demo riders: ${SEEDED_PHONE_HINTS.join(" · ")}`}
          onVerified={handleOtpVerified}
        />
        <p className="text-center text-xs text-muted-foreground">
          Want to shop instead?{" "}
          <button
            type="button"
            className="font-semibold text-brand underline-offset-2 hover:underline"
            onClick={() => onNavigate("home")}
          >
            Go to store
          </button>
        </p>
      </div>
    );
  }

  // =================== Logged-in dashboard ===================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bike className="text-brand" size={24} />
            <h1 className="text-2xl font-extrabold">Rider Portal</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Welcome back,{" "}
            <span className="font-semibold text-foreground">
              {portal.fullName || "Rider"}
            </span>
            .
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut size={14} /> Sign out
        </Button>
      </div>

      {/* Online toggle */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full animate-pulse ${
              portal.isOnline ? "bg-brand" : "bg-muted-foreground/50"
            }`}
            aria-hidden
          />
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {portal.isOnline ? "Online — ready for dispatch" : "Offline"}
              </span>
              <Badge
                className={
                  portal.isOnline
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground"
                }
              >
                {portal.isOnline ? "ONLINE" : "OFFLINE"}
              </Badge>
              {portal.isOnline && connected && (
                <Badge variant="outline" className="border-brand text-brand">
                  Live
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {portal.isOnline
                ? "We'll ping you the moment a delivery is assigned."
                : "Toggle on to receive deliveries."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="online-toggle"
            className="text-[11px] text-muted-foreground"
          >
            {togglingOnline ? "Updating…" : ""}
          </Label>
          <Switch
            id="online-toggle"
            checked={portal.isOnline}
            onCheckedChange={(v) => void toggleOnline(v)}
            disabled={togglingOnline}
            className="data-[state=checked]:bg-brand"
          />
        </div>
      </Card>

      {/* Presence strip */}
      {portal.isOnline && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Online now:</span>
          {presence
            .filter((p) => !(p.kind === "rider" && p.id === riderKey))
            .slice(0, 10)
            .map((p, i) => (
              <Badge
                key={`${p.kind}-${p.id}-${i}`}
                variant="outline"
                className={
                  p.kind === "rider"
                    ? "border-brand/40 text-brand"
                    : p.kind === "vendor"
                      ? "border-gold/40 text-gold"
                      : "text-muted-foreground"
                }
              >
                {p.kind === "rider" ? "🛵" : p.kind === "vendor" ? "🏪" : "🛡️"}{" "}
                {p.name}
              </Badge>
            ))}
          {presence.filter((p) => !(p.kind === "rider" && p.id === riderKey))
            .length === 0 && (
            <span className="text-[11px] text-muted-foreground">
              just you for now
            </span>
          )}
        </div>
      )}

      {/* Profile + Earnings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile */}
        <Card className="space-y-3 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="text-brand" size={18} />
              <h2 className="text-sm font-bold">Profile</h2>
            </div>
            {rating !== null && (
              <span className="inline-flex items-center gap-1 text-sm">
                <Star size={14} className="fill-gold text-gold" />
                <span className="font-bold">{rating.toFixed(1)}</span>
                <span className="text-[11px] text-muted-foreground">
                  rider rating
                </span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-0.5">
              <Label className="text-[11px] text-muted-foreground">Full name</Label>
              <div className="text-sm font-semibold">
                {portal.fullName || "—"}
              </div>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[11px] text-muted-foreground">Phone</Label>
              <div className="inline-flex items-center gap-1 text-sm font-semibold">
                <Phone size={12} className="text-muted-foreground" />
                {portal.phone}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label
                htmlFor="plate"
                className="text-[11px] text-muted-foreground"
              >
                Number plate
                {savingPlate && (
                  <span className="ml-1 text-muted-foreground">· saving…</span>
                )}
              </Label>
              <Input
                id="plate"
                value={plateDraft}
                onChange={(e) => setPlateDraft(e.target.value)}
                onBlur={() => void savePlate()}
                placeholder="e.g. KMEA 224B"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-0.5 sm:col-span-2">
              <Label className="text-[11px] text-muted-foreground">
                Last seen
              </Label>
              <div className="inline-flex items-center gap-1 text-sm">
                <Clock size={12} className="text-muted-foreground" />
                {portal.lastSeen
                  ? new Date(portal.lastSeen).toLocaleString("en-KE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
            </div>
          </div>
        </Card>

        {/* Earnings summary */}
        <Card className="space-y-2 border-brand/30 bg-brand-light p-5">
          <div className="flex items-center gap-2">
            <Wallet className="text-brand" size={18} />
            <h2 className="text-sm font-bold text-brand">Earnings</h2>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">
              Lifetime payout (delivered)
            </div>
            <div className="text-2xl font-extrabold text-brand">
              {KES(totalEarnings)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Earned today</span>
            <span className="font-semibold text-foreground">
              {KES(earnedToday)}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 text-[11px] text-brand">
            <Zap size={11} />
            10% platform levy deducted
          </div>
        </Card>
      </div>

      {/* Deliveries + Notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Assigned deliveries */}
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck className="text-brand" size={18} />
              <h2 className="text-sm font-bold">Assigned deliveries</h2>
            </div>
            <Badge className="bg-brand-light text-brand">
              {activeOrders.length} active · {KES(earnedToday)} today
            </Badge>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
              <div className="text-4xl" aria-hidden>
                🛵
              </div>
              <div className="mt-2 text-sm font-semibold">
                No deliveries yet
              </div>
              <p className="text-xs text-muted-foreground">
                When an order is dispatched to you, it'll show up here
                automatically.
              </p>
            </div>
          ) : (
            <div className="wb-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
              {orders.map((o) => {
                const id = o.id.slice(-8).toUpperCase();
                return (
                  <div
                    key={o.id}
                    className="space-y-2 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">
                        #{id}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusPillClass(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        {o.vendor.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {o.customerName}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {o.vendor.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-brand">
                          {KES(o.total)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          order total
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {o.location}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-[11px]">
                      <span className="text-muted-foreground">Your payout</span>
                      <span className="font-bold text-mpesa">
                        {KES(o.driverPayout || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-muted-foreground">
                        Platform levy (10%)
                      </span>
                      <span className="text-muted-foreground">
                        {KES(o.driverLevy || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Notifications feed */}
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="text-brand" size={18} />
              <h2 className="text-sm font-bold">Alerts</h2>
              {unreadCount > 0 && (
                <Badge className="bg-gold text-white">{unreadCount} new</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </Button>
            )}
          </div>
          {mergedNotifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
              <div className="text-4xl" aria-hidden>
                🔔
              </div>
              <div className="mt-2 text-sm font-semibold">No alerts yet</div>
              <p className="text-xs text-muted-foreground">
                Dispatch alerts and order updates will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="wb-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
              {mergedNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    n.read
                      ? "border-border bg-card"
                      : "border-brand/40 bg-brand-light/40 hover:bg-brand-light"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {!n.read && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-brand"
                          aria-label="Unread"
                        />
                      )}
                      <span className="truncate text-sm font-semibold">
                        {n.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default RiderPortalPage;
