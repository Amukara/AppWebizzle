"use client";

import * as React from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Power,
  Send,
  ShoppingBag,
  Star,
  Store,
  Users,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KES } from "../logo";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OtpLoginGate } from "../ui/otp-login-gate";
import type {
  AppNotification,
  ChatMessage,
  PresenceEntry,
  VendorPortal,
} from "@/lib/types";

// Portal session token (set after OTP verification).
const PORTAL_TOKEN_KEY = "wb_vendor_portal_token";
function getPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(PORTAL_TOKEN_KEY); } catch { return null; }
}
function setPortalToken(t: string | null) {
  if (typeof window === "undefined") return;
  try { if (t) sessionStorage.setItem(PORTAL_TOKEN_KEY, t); else sessionStorage.removeItem(PORTAL_TOKEN_KEY); } catch {}
}

// ---------- helpers ----------
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

// True if `now` falls inside the [start, end) duty window. Handles overnight
// windows (e.g. 22:00 → 06:00). Empty schedule ⇒ treat as always on duty.
function isWithinDuty(start: string, end: string, now = nowHHMM()): boolean {
  if (!start || !end) return true;
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end; // overnight
}

// Vendor portal auth: phone + OTP → session token → look up by phone.

// ---------- online status dot ----------
function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 rounded-full",
        online
          ? "bg-brand animate-pulse"
          : "bg-muted-foreground/40"
      )}
    />
  );
}

// ---------- main ----------
export function VendorPortalPage({
  onNavigate,
}: {
  onNavigate: (p: "home" | "basket") => void;
}) {
  const { toast } = useToast();

  // login gate — phone + OTP auth
  const [verifiedPhone, setVerifiedPhone] = React.useState<string | null>(null);
  const [portalToken, setPortalTokenState] = React.useState<string | null>(getPortalToken);
  const [vendorId, setVendorId] = React.useState<string | null>(null);

  // profile
  const [portal, setPortal] = React.useState<VendorPortal | null>(null);
  const [vendor, setVendor] = React.useState<{
    id: string;
    name: string;
    emoji: string;
    type: string;
    location: string;
    rating: number;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // editable duty / phone (local until blur → PATCH)
  const [dutyStart, setDutyStart] = React.useState("");
  const [dutyEnd, setDutyEnd] = React.useState("");
  const [phoneInput, setPhoneInput] = React.useState("");
  const [patching, setPatching] = React.useState(false);

  // notifications
  const [notifications, setNotifications] = React.useState<AppNotification[]>(
    []
  );
  const [loadingNotifs, setLoadingNotifs] = React.useState(false);
  const [notifError, setNotifError] = React.useState<string | null>(null);

  // chat
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = React.useState("");
  const [loadingChat, setLoadingChat] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const chatListRef = React.useRef<HTMLDivElement>(null);

  // ---- realtime: register presence only when the vendor is online ----
  const isOnline = portal?.isOnline ?? false;
  const me = React.useMemo(() => {
    if (!vendorId || !portal || !isOnline) return null;
    return {
      kind: "vendor" as const,
      id: vendorId,
      name: portal.shopName,
    };
  }, [vendorId, portal, isOnline]);
  const { connected, presence, notifications: rtNotifications, socket } =
    useRealtime(me);

  // ---- merge realtime notifications into the feed + toast new ones ----
  const seenRtKeys = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    if (!rtNotifications || rtNotifications.length === 0) return;
    const incoming = rtNotifications as Array<Record<string, unknown>>;
    // Process oldest→newest so toasts fire in arrival order.
    for (let i = incoming.length - 1; i >= 0; i--) {
      const n = incoming[i];
      const key = String(
        n.at ?? n.orderId ?? n.type ?? `${i}-${n.customerName ?? ""}`
      );
      if (seenRtKeys.current.has(key)) continue;
      seenRtKeys.current.add(key);

      const type = String(n.type ?? "SYSTEM");
      const orderId = n.orderId ? String(n.orderId) : null;
      const customerName = n.customerName
        ? String(n.customerName)
        : "a customer";
      const total = typeof n.total === "number" ? n.total : null;

      const title = type === "NEW_ORDER" ? "New order!" : "Notification";
      const body = total
        ? `Order ${orderId ?? ""} from ${customerName} — ${KES(total)}`.trim()
        : `Order ${orderId ?? ""} from ${customerName}`.trim();

      const synth: AppNotification = {
        id: `rt-${key}`,
        recipientType: "VENDOR",
        recipientId: vendorId ?? "",
        type,
        title,
        body,
        read: false,
        orderId,
        createdAt: n.at ? String(n.at) : new Date().toISOString(),
      };

      setNotifications((prev) =>
        prev.some((p) => p.id === synth.id) ? prev : [synth, ...prev]
      );
      toast({ title, description: body });
    }
  }, [rtNotifications, vendorId, toast]);

  // ---- loaders ----
  const loadProfile = React.useCallback(async (vid: string, token?: string | null) => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["x-portal-token"] = token;
      const res = await fetch(
        `/api/portal/vendor?vendorId=${encodeURIComponent(vid)}`,
        { headers }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setPortal(data.portal);
      setVendor(data.vendor);
      setDutyStart(data.portal.dutyStart || "");
      setDutyEnd(data.portal.dutyEnd || "");
      setPhoneInput(data.portal.phone || "");
    } catch (e) {
      setProfileError(
        e instanceof Error ? e.message : "Failed to load portal profile"
      );
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadNotifications = React.useCallback(async (vid: string) => {
    setLoadingNotifs(true);
    setNotifError(null);
    try {
      const res = await fetch(
        `/api/notifications?recipientType=VENDOR&recipientId=${encodeURIComponent(
          vid
        )}`
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (e) {
      setNotifError(
        e instanceof Error ? e.message : "Failed to load notifications"
      );
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  const loadChat = React.useCallback(async (vid: string) => {
    setLoadingChat(true);
    setChatError(null);
    try {
      const res = await fetch(
        `/api/chat?channel=vendor:${encodeURIComponent(vid)}`
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Failed to load chat");
    } finally {
      setLoadingChat(false);
    }
  }, []);

  // initial load on login
  React.useEffect(() => {
    if (!vendorId) return;
    loadProfile(vendorId);
    loadNotifications(vendorId);
    loadChat(vendorId);
  }, [vendorId, loadProfile, loadNotifications, loadChat]);

  // poll notifications every 15s
  React.useEffect(() => {
    if (!vendorId) return;
    const t = setInterval(() => loadNotifications(vendorId), 15000);
    return () => clearInterval(t);
  }, [vendorId, loadNotifications]);

  // listen for incoming chat messages on the socket
  React.useEffect(() => {
    if (!socket) return;
    const handler = (msg: ChatMessage & { at?: string }) => {
      // Ignore our own echoed messages (senderType VENDOR + our id).
      if (msg.senderType === "VENDOR" && msg.senderId === vendorId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const normalized: ChatMessage = {
          id: msg.id,
          channel: msg.channel,
          senderType: msg.senderType,
          senderId: msg.senderId,
          senderName: msg.senderName,
          body: msg.body,
          read: msg.read ?? false,
          createdAt: msg.createdAt || msg.at || new Date().toISOString(),
        };
        return [...prev, normalized];
      });
    };
    socket.on("chat:message", handler);
    return () => {
      socket.off("chat:message", handler);
    };
  }, [socket, vendorId]);

  // auto-scroll chat to bottom on new messages
  React.useEffect(() => {
    const el = chatListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ---- actions ----
  async function patchPortal(patch: {
    isOnline?: boolean;
    dutyStart?: string;
    dutyEnd?: string;
    phone?: string;
  }) {
    if (!vendorId || !portal) return null;
    setPatching(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = portalToken;
      if (token) headers["x-portal-token"] = token;
      const res = await fetch("/api/portal/vendor", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ vendorId, ...patch }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setPortal(data.portal);
      return data.portal as VendorPortal;
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setPatching(false);
    }
  }

  async function toggleOnline() {
    if (!portal) return;
    const next = !portal.isOnline;
    const onDuty = isWithinDuty(dutyStart, dutyEnd);
    // optimistic
    setPortal({ ...portal, isOnline: next });
    await patchPortal({ isOnline: next });
    toast({
      title: next ? "You're online" : "You're offline",
      description: next
        ? onDuty
          ? "Shoppers can now see your shop as available."
          : "Online outside duty hours — shoppers can still reach you."
        : "You won't receive new order pings until you return.",
    });
  }

  function handleDutyBlur() {
    if (!portal) return;
    if (dutyStart === portal.dutyStart && dutyEnd === portal.dutyEnd) return;
    patchPortal({ dutyStart, dutyEnd });
  }

  function handlePhoneBlur() {
    if (!portal) return;
    if (phoneInput === portal.phone) return;
    patchPortal({ phone: phoneInput });
  }

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* ignore — optimistic */
    }
  }

  async function markAllRead() {
    if (!vendorId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "VENDOR",
          recipientId: vendorId,
        }),
      });
    } catch {
      /* ignore — optimistic */
    }
  }

  async function sendChat() {
    const body = chatDraft.trim();
    if (!body || !vendorId || !portal || sending) return;
    const channel = `vendor:${vendorId}`;
    const payload = {
      channel,
      senderType: "VENDOR",
      senderId: vendorId,
      senderName: portal.shopName,
      body,
    };
    setSending(true);
    setChatDraft("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      const msg: ChatMessage = data.message;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      // also push via the socket so admin support receives it in real time
      if (socket) socket.emit("chat:message", payload);
    } catch (e) {
      toast({
        title: "Message failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      setChatDraft(body); // restore draft
    } finally {
      setSending(false);
    }
  }

  // ---------- OTP verified → look up vendor by phone ----------
  const handleOtpVerified = React.useCallback(async (phone: string, token: string) => {
    setVerifiedPhone(phone);
    setPortalTokenState(token);
    setPortalToken(token);
    // Look up vendor portal by phone
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch(`/api/portal/vendor?phone=${encodeURIComponent(phone)}`, {
        headers: { "x-portal-token": token },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      if (!data.portal || !data.vendor) {
        throw new Error("No vendor found for this phone. Please register as a vendor first.");
      }
      setVendorId(data.vendor.id);
      setPortal(data.portal);
      setVendor(data.vendor);
      setDutyStart(data.portal.dutyStart || "");
      setDutyEnd(data.portal.dutyEnd || "");
      setPhoneInput(data.portal.phone || "");
      toast({ title: `Karibu, ${data.vendor.name}!`, description: "You're signed in to the vendor portal." });
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Could not load vendor portal.");
      setPortalTokenState(null);
      setPortalToken(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [toast]);

  // Auto-load profile if we have a vendorId
  React.useEffect(() => {
    if (vendorId && !portal) void loadProfile(vendorId, portalToken);
  }, [vendorId, portal, portalToken, loadProfile]);

  const handleSignOut = React.useCallback(() => {
    setVendorId(null);
    setPortal(null);
    setVendor(null);
    setVerifiedPhone(null);
    setPortalTokenState(null);
    setPortalToken(null);
    setNotifications([]);
    setMessages([]);
    setProfileError(null);
  }, []);

  // ---------- gate ----------
  if (!vendorId) {
    if (loadingProfile) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={28} />
        </div>
      );
    }
    if (profileError) {
      return (
        <OtpLoginGate
          kind="vendor"
          icon={<Store className="text-brand" size={26} />}
          title="Vendor Portal"
          subtitle="Sign in with your phone to manage your shop, orders and support chat."
          placeholder="e.g. 0712 345 678"
          onVerified={handleOtpVerified}
        />
      );
    }
    return (
      <OtpLoginGate
        kind="vendor"
        icon={<Store className="text-brand" size={26} />}
        title="Vendor Portal"
        subtitle="Sign in with your phone to manage your shop, orders and support chat."
        placeholder="e.g. 0712 345 678"
        onVerified={handleOtpVerified}
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const onDuty = isWithinDuty(dutyStart, dutyEnd);
  const channel = `vendor:${vendorId}`;
  const otherPresence = presence.filter(
    (p) => !(p.kind === "vendor" && p.id === vendorId)
  );

  return (
    <div className="space-y-5">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onNavigate("home")}
        >
          <ArrowLeft size={16} /> Back to shop
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-brand"
          onClick={() => onNavigate("basket")}
        >
          <ShoppingBag size={16} /> Smart Basket
        </Button>
      </div>

      {/* shop identity + online toggle */}
      <Card>
        <CardContent className="p-6">
          {loadingProfile && !portal ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /> Loading portal…
            </div>
          ) : profileError ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-destructive">{profileError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-xl bg-brand-light text-3xl">
                  {vendor?.emoji ?? "🏪"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      {portal?.shopName ?? vendor?.name ?? "Vendor"}
                    </h2>
                    <Badge
                      variant={isOnline ? "default" : "secondary"}
                      className={cn(
                        "gap-1.5",
                        isOnline
                          ? "bg-brand text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <OnlineDot online={isOnline} />
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {vendor?.type && (
                      <span className="inline-flex items-center gap-1">
                        <Store size={12} /> {vendor.type}
                      </span>
                    )}
                    {vendor?.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {vendor.location}
                      </span>
                    )}
                    {typeof vendor?.rating === "number" && (
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} className="fill-gold text-gold" />
                        {vendor.rating.toFixed(1)}
                      </span>
                    )}
                    {connected && (
                      <span className="inline-flex items-center gap-1 text-brand">
                        <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                        realtime live
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={toggleOnline}
                disabled={patching}
                className={cn(
                  "h-11 px-6",
                  isOnline
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "bg-brand text-primary-foreground hover:bg-brand-dark"
                )}
              >
                {patching ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Power size={16} />
                )}
                {isOnline ? "Go offline" : "Go online"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* duty hours + phone */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock size={16} className="text-brand" /> Duty hours
            </h3>
            <Badge
              variant="outline"
              className={cn(
                onDuty
                  ? "border-brand/30 text-brand"
                  : "text-muted-foreground"
              )}
            >
              {dutyStart && dutyEnd
                ? onDuty
                  ? "Currently on duty"
                  : "Off duty"
                : "No schedule set"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="duty-start" className="text-xs">
                Start
              </Label>
              <Input
                id="duty-start"
                type="time"
                value={dutyStart}
                onChange={(e) => setDutyStart(e.target.value)}
                onBlur={handleDutyBlur}
                disabled={patching}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duty-end" className="text-xs">
                End
              </Label>
              <Input
                id="duty-end"
                type="time"
                value={dutyEnd}
                onChange={(e) => setDutyEnd(e.target.value)}
                onBlur={handleDutyBlur}
                disabled={patching}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">
                Shop phone
              </Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="0712 345 678"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onBlur={handlePhoneBlur}
                disabled={patching}
              />
            </div>
          </div>
          {isOnline && !onDuty && dutyStart && dutyEnd && (
            <p className="mt-3 text-xs text-gold">
              You&apos;re online outside your duty window ({dutyStart}–
              {dutyEnd}). That&apos;s fine — orders will still come through.
            </p>
          )}
        </CardContent>
      </Card>

      {/* presence strip */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users size={14} /> Online now
            </span>
            {otherPresence.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No one else online right now.
              </span>
            ) : (
              otherPresence.map((p: PresenceEntry) => (
                <span
                  key={`${p.kind}:${p.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    p.kind === "vendor" &&
                      "border-brand/30 bg-brand-light text-brand",
                    p.kind === "rider" &&
                      "border-gold/40 bg-gold/10 text-gold-dark",
                    p.kind === "admin" &&
                      "border-mpesa/40 bg-mpesa/10 text-mpesa"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current opacity-70" />
                  <span className="capitalize opacity-70">{p.kind}</span>
                  {p.name}
                </span>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* main grid: notifications | chat */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* notifications */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bell size={16} className="text-brand" /> Order notifications
                {unreadCount > 0 && (
                  <Badge className="bg-brand text-primary-foreground">
                    {unreadCount} new
                  </Badge>
                )}
              </h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={markAllRead}
                >
                  <CheckCheck size={14} /> Mark all read
                </Button>
              )}
            </div>
            {notifError ? (
              <p className="py-6 text-center text-sm text-destructive">
                {notifError}
              </p>
            ) : loadingNotifs && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <BellOff className="text-muted-foreground" size={28} />
                <p className="text-sm text-muted-foreground">
                  No notifications yet. New orders will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto wb-scroll pr-1">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && markRead(n.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      n.read
                        ? "border-border bg-card hover:bg-accent/40"
                        : "border-brand/30 bg-brand-light hover:bg-brand-light/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {n.type === "NEW_ORDER" && (
                        <Badge className="bg-brand text-primary-foreground">
                          New order
                        </Badge>
                      )}
                      {n.orderId && (
                        <span className="text-[11px] text-muted-foreground">
                          #{n.orderId}
                        </span>
                      )}
                      {!n.read && (
                        <span className="ml-auto text-[11px] font-medium text-brand">
                          Tap to mark read
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* chat */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquare size={16} className="text-brand" /> Support chat
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {socket ? "Live" : "Connect to chat live"}
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Channel{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                {channel}
              </code>{" "}
              — message WeBizzle admin support.
            </p>

            {chatError ? (
              <p className="py-6 text-center text-sm text-destructive">
                {chatError}
              </p>
            ) : loadingChat && messages.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading chat…
              </div>
            ) : (
              <div
                ref={chatListRef}
                className="max-h-96 min-h-[14rem] space-y-2 overflow-y-auto wb-scroll rounded-lg bg-muted/40 p-3 pr-1"
              >
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No messages yet. Say hello to admin support 👋
                  </p>
                ) : (
                  messages.map((m) => {
                    const own =
                      m.senderType === "VENDOR" && m.senderId === vendorId;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex flex-col",
                          own ? "items-end" : "items-start"
                        )}
                      >
                        {!own && (
                          <span className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">
                            {m.senderName || "Admin"}
                          </span>
                        )}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                            own
                              ? "bg-brand text-primary-foreground rounded-br-sm"
                              : "bg-card border text-card-foreground rounded-bl-sm"
                          )}
                        >
                          {m.body}
                        </div>
                        <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                          {relativeTime(m.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendChat();
              }}
            >
              <Input
                placeholder="Type a message…"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                disabled={sending || !portal}
                maxLength={1000}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-brand text-primary-foreground hover:bg-brand-dark"
                disabled={sending || !chatDraft.trim() || !portal}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </form>
            {!socket && (
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Phone size={11} /> Go online to receive live replies from
                admin support.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VendorPortalPage;
