"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  User,
  Phone,
  Loader2,
  Copy,
  Check,
  MessageCircle,
  MessageSquareText,
  Link2,
  Sparkles,
  MousePointerClick,
  Users,
  ShoppingCart,
  ArrowRight,
  Coins,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KES } from "../logo";
import { PageHead } from "./orders";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  REFERRAL_REWARD_LABEL,
  REFEREE_DISCOUNT_KES,
} from "@/lib/fees";
import { getCustomerProfile } from "@/lib/customer";
import type { Referral } from "@/lib/types";

export function ReferralsPage({
  onNavigate,
}: {
  onNavigate: (p: "home" | "basket" | "orders") => void;
}) {
  const { toast } = useToast();
  // Default to the saved customer profile so the phone/name carry over.
  const [saved] = useState(() => getCustomerProfile());
  const [name, setName] = useState(saved.name);
  const [phone, setPhone] = useState(saved.phone);
  const [creating, setCreating] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const phoneValid = /^07\d{8}$/.test(phone.trim());
  const nameValid = name.trim().length >= 2;
  const identified = phoneValid && nameValid;

  // Fetch referrals whenever a valid phone is set.
  useEffect(() => {
    if (!phoneValid) {
      setReferrals([]);
      return;
    }
    let alive = true;
    setLoadingList(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/referrals?phone=${encodeURIComponent(phone.trim())}`,
        ).then((r) => r.json());
        if (alive) setReferrals((res.referrals as Referral[]) || []);
      } catch {
        if (alive) setReferrals([]);
      } finally {
        if (alive) setLoadingList(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [phone, phoneValid]);

  const totalEarned = referrals.reduce((s, r) => s + (r.rewardEarned || 0), 0);
  const latest = referrals[0] ?? null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 1500);
      toast({ title: "Copied!", description: label });
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy it manually.",
      });
    }
  };

  const handleCreate = async () => {
    if (!identified || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: name.trim(),
          ownerPhone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Could not create code",
          description: data.error || "Please try again.",
        });
        return;
      }
      const ref = data.referral as Referral;
      setReferrals((prev) => [ref, ...prev]);
      toast({
        title: "Your code is ready! 🎉",
        description: `Share ${ref.code} with friends — you earn a ${REFERRAL_REWARD_LABEL} when they place their first order.`,
      });
    } catch {
      toast({
        title: "Network error",
        description: "Please try again in a moment.",
      });
    } finally {
      setCreating(false);
    }
  };

  const shareUrl = (code: string) => `https://we-bizzle.com/r/${code}`;
  const shareText = (code: string) =>
    `Shop on WeBizzle with my code ${code} and get KES ${REFEREE_DISCOUNT_KES} off your first order! 🛒 ${code}`;

  return (
    <div className="space-y-5">
      <PageHead
        icon={<Gift className="text-brand" size={24} />}
        title="Refer & Earn"
        desc={`Invite friends to WeBizzle. When they place their first order, you earn a ${REFERRAL_REWARD_LABEL} — your friend gets ${KES(REFEREE_DISCOUNT_KES)} off.`}
      />

      {/* Identify yourself */}
      <Card className="space-y-3 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-light text-brand">
            <User size={16} />
          </span>
          <h3 className="text-sm font-bold">Your details</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ref-name" className="flex items-center gap-1.5">
              <User size={14} /> Your name
            </Label>
            <Input
              id="ref-name"
              placeholder="e.g. Wanjir Mwangi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref-phone" className="flex items-center gap-1.5">
              <Phone size={14} /> M-Pesa phone
            </Label>
            <Input
              id="ref-phone"
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              maxLength={10}
            />
          </div>
        </div>
        {phone.length > 0 && !phoneValid && (
          <p className="text-xs text-destructive">
            Enter a valid Safaricom number (07XXXXXXXX).
          </p>
        )}
      </Card>

      {/* Empty state — no phone */}
      {!identified && (
        <Card className="flex flex-col items-center gap-3 p-6 text-center sm:p-10">
          <div className="text-5xl" aria-hidden>
            🎁
          </div>
          <h2 className="text-xl font-bold">Enter your details to start</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            We&apos;ll generate a personal referral code you can share with
            friends. You earn a {REFERRAL_REWARD_LABEL} every time a friend
            places their first order.
          </p>
          <Button
            variant="outline"
            className="mt-2 bg-brand text-white hover:bg-brand-dark"
            onClick={() => onNavigate("basket")}
          >
            <ShoppingCart size={16} /> Start shopping
          </Button>
        </Card>
      )}

      {identified && (
        <>
          {/* Generate + featured code */}
          <Card className="space-y-4 p-4 sm:p-6">
            {latest ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles size={12} className="text-gold" /> Your latest code
                </div>
                <div className="flex flex-col gap-3 rounded-2xl bg-brand-light p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-mono text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
                      {latest.code}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(latest.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {latest.clicks} clicks · {latest.signups} signups
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 bg-card"
                    onClick={() =>
                      copyToClipboard(
                        latest.code,
                        "Referral code copied to clipboard.",
                      )
                    }
                  >
                    {copiedToken === latest.code ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy code
                      </>
                    )}
                  </Button>
                </div>

                {/* Share row */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Share with friends
                  </div>
                  <ShareRow
                    code={latest.code}
                    text={shareText(latest.code)}
                    url={shareUrl(latest.code)}
                    copiedToken={copiedToken}
                    onCopy={copyToClipboard}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Plus /> Generate another code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold-dark">
                    <Sparkles size={16} />
                  </span>
                  <h3 className="text-sm font-bold">Generate your referral code</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll build a short, shareable code from your name. Send
                  it to friends — when they shop on WeBizzle, you earn a{" "}
                  {REFERRAL_REWARD_LABEL}.
                </p>
                <Button
                  type="button"
                  className="w-full bg-brand text-white hover:bg-brand-dark"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Gift size={16} /> Generate my code
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* How it works */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-bold">How it works</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <HowStep
                step={1}
                icon={<MousePointerClick size={16} />}
                title="Share your code"
                desc={`Send your code via WhatsApp or SMS. Your friend gets ${KES(REFEREE_DISCOUNT_KES)} off their first order.`}
              />
              <HowStep
                step={2}
                icon={<ShoppingCart size={16} />}
                title="Friend orders"
                desc="They shop on WeBizzle, enter your code at checkout, and pay with M-Pesa."
              />
              <HowStep
                step={3}
                icon={<Coins size={16} />}
                title="You earn a voucher"
                desc={`You earn a ${REFERRAL_REWARD_LABEL} per order. Redeem it on your next WeBizzle shop.`}
              />
            </div>
          </Card>

          {/* My referrals list */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold">My referral codes</h3>
                <p className="text-[11px] text-muted-foreground">
                  {referrals.length} code{referrals.length !== 1 ? "s" : ""} ·{" "}
                  {loadingList ? "loading…" : "live stats"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Voucher credit
                </div>
                <div className="text-lg font-extrabold text-brand">
                  {KES(totalEarned)}
                </div>
              </div>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading your
                codes…
              </div>
            ) : referrals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="text-3xl" aria-hidden>
                  📭
                </div>
                <p className="text-sm text-muted-foreground">
                  No codes yet. Generate one above to start earning.
                </p>
              </div>
            ) : (
              <div className="max-h-96 divide-y divide-border overflow-y-auto wb-scroll">
                {referrals.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-brand">
                          {r.code}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs sm:grid-cols-4">
                      <Stat
                        icon={<MousePointerClick size={12} />}
                        label="Clicks"
                        value={r.clicks}
                      />
                      <Stat
                        icon={<Users size={12} />}
                        label="Signups"
                        value={r.signups}
                      />
                      <Stat
                        icon={<ShoppingCart size={12} />}
                        label="Orders"
                        value={r.orders}
                      />
                      <Stat
                        icon={<Coins size={12} />}
                        label="Vouchers"
                        value={KES(r.rewardEarned)}
                      />
                    </div>
                    <div className="mt-3">
                      <ShareRow
                        code={r.code}
                        text={shareText(r.code)}
                        url={shareUrl(r.code)}
                        copiedToken={copiedToken}
                        onCopy={copyToClipboard}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-4">
            <div className="text-sm">
              <div className="font-semibold">Ready to shop?</div>
              <div className="text-xs text-muted-foreground">
                Build a Smart Basket and we&apos;ll find you the cheapest vendor.
              </div>
            </div>
            <Button
              className="bg-brand text-white hover:bg-brand-dark"
              onClick={() => onNavigate("basket")}
            >
              Start shopping <ArrowRight size={14} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ShareRow({
  code,
  text,
  url,
  copiedToken,
  onCopy,
}: {
  code: string;
  text: string;
  url: string;
  copiedToken: string | null;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" className="bg-mpesa text-white hover:bg-mpesa/90" asChild>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={`sms:?body=${encodeURIComponent(text)}`}>
          <MessageSquareText size={14} /> SMS
        </a>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onCopy(url, "Referral link copied to clipboard.")}
      >
        {copiedToken === url ? <Check size={14} /> : <Link2 size={14} />}
        Copy link
      </Button>
      <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
        {code}
      </span>
    </div>
  );
}

function HowStep({
  step,
  icon,
  title,
  desc,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand">
          {step}
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-light text-brand">
          {icon}
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIVE: { cls: "bg-brand-light text-brand", label: "Active" },
    PAUSED: { cls: "bg-muted text-muted-foreground", label: "Paused" },
    REWARDED: { cls: "bg-gold/15 text-gold-dark", label: "Rewarded" },
  };
  const entry = map[status] || {
    cls: "bg-muted text-muted-foreground",
    label: status,
  };
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", entry.cls)}
    >
      {entry.label}
    </Badge>
  );
}
