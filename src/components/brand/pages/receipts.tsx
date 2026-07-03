"use client";

import { useEffect, useRef, useState } from "react";
import {
  Receipt,
  Phone,
  Loader2,
  ImagePlus,
  Upload,
  X,
  Sparkles,
  Coins,
  Store,
  Calendar,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
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
  RECEIPT_TOKENS_PER_UPLOAD,
  TOKENS_PER_KES_DISCOUNT,
} from "@/lib/fees";
import { getCustomerProfile } from "@/lib/customer";
import type { ReceiptSubmission } from "@/lib/types";

type UploadResult = {
  retailerName: string | null;
  extractedTotal: number;
  receiptDate: string | null;
};

export function ReceiptsPage({
  onNavigate,
}: {
  onNavigate: (p: "home" | "basket" | "orders") => void;
}) {
  const { toast } = useToast();
  // Default to the saved customer phone so receipts tie to the same account.
  const [saved] = useState(() => getCustomerProfile());
  const [phone, setPhone] = useState(saved.phone);
  const [receipts, setReceipts] = useState<ReceiptSubmission[]>([]);
  const [tokens, setTokens] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  // Upload state
  const inputRef = useRef<HTMLInputElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<UploadResult | null>(null);

  const phoneValid = /^07\d{8}$/.test(phone.trim());

  useEffect(() => {
    if (!phoneValid) {
      setReceipts([]);
      setTokens(0);
      return;
    }
    let alive = true;
    setLoadingList(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/receipts?phone=${encodeURIComponent(phone.trim())}`,
        ).then((r) => r.json());
        if (alive) {
          setReceipts((res.receipts as ReceiptSubmission[]) || []);
          setTokens(Number(res.tokens) || 0);
        }
      } catch {
        if (alive) {
          setReceipts([]);
          setTokens(0);
        }
      } finally {
        if (alive) setLoadingList(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [phone, phoneValid]);

  const kesDiscount = Math.floor(tokens / TOKENS_PER_KES_DISCOUNT);

  const handleFile = (file: File) => {
    setFileError(null);
    if (!file.type.startsWith("image/")) {
      setFileError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setFileError(
        `Image is too large (${(file.size / 1024).toFixed(0)}KB). Keep it under 1.5MB.`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDataUrl(reader.result as string);
    reader.onerror = () =>
      setFileError("Could not read the file. Please try another.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!phoneValid || !dataUrl || uploading) return;
    setUploading(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: phone.trim(),
          receipt: dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Upload failed",
          description: data.error || "Please try again.",
        });
        return;
      }
      const r = data.receipt as UploadResult;
      setLastResult(r);
      setDataUrl(null);
      toast({
        title: "Receipt uploaded! 🧾",
        description:
          data.message ||
          `Pending review for ${RECEIPT_TOKENS_PER_UPLOAD} tokens.`,
      });
      // Refresh list + balance
      const fresh = await fetch(
        `/api/receipts?phone=${encodeURIComponent(phone.trim())}`,
      ).then((r2) => r2.json());
      setReceipts((fresh.receipts as ReceiptSubmission[]) || []);
      setTokens(Number(fresh.tokens) || 0);
    } catch {
      toast({
        title: "Network error",
        description: "Please try again in a moment.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        icon={<Receipt className="text-brand" size={24} />}
        title="Receipt Rewards"
        desc={`Snap any physical shop receipt and earn ${RECEIPT_TOKENS_PER_UPLOAD} tokens per approved upload.`}
      />

      {/* Identify */}
      <Card className="space-y-3 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-light text-brand">
            <Phone size={16} />
          </span>
          <h3 className="text-sm font-bold">Your M-Pesa phone</h3>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rec-phone" className="flex items-center gap-1.5">
            <Phone size={14} /> Phone number
          </Label>
          <Input
            id="rec-phone"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            maxLength={10}
          />
        </div>
        {phone.length > 0 && !phoneValid && (
          <p className="text-xs text-destructive">
            Enter a valid Safaricom number (07XXXXXXXX).
          </p>
        )}
      </Card>

      {/* Empty state */}
      {!phoneValid && (
        <Card className="flex flex-col items-center gap-3 p-6 text-center sm:p-10">
          <div className="text-5xl" aria-hidden>
            🧾
          </div>
          <h2 className="text-xl font-bold">Enter your phone to start</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            We&apos;ll track your token balance and receipt history. Every
            approved receipt earns {RECEIPT_TOKENS_PER_UPLOAD} tokens — that&apos;s{" "}
            {KES(TOKENS_PER_KES_DISCOUNT)} off your next order.
          </p>
          <Button
            variant="outline"
            className="mt-2 bg-brand text-white hover:bg-brand-dark"
            onClick={() => onNavigate("basket")}
          >
            <ShoppingBag size={16} /> Start shopping
          </Button>
        </Card>
      )}

      {phoneValid && (
        <>
          {/* Token balance hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-dark p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Coins size={12} /> Your token balance
              </span>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {tokens}
                </span>
                <span className="mb-1.5 text-sm text-white/80">
                  tokens {tokens === 1 ? "" : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/80">
                Worth{" "}
                <span className="font-bold text-gold">
                  {KES(kesDiscount)}
                </span>{" "}
                off your next order ({TOKENS_PER_KES_DISCOUNT} tokens = {KES(TOKENS_PER_KES_DISCOUNT)}).
              </p>
              <Button
                size="sm"
                className="mt-4 bg-white text-brand hover:bg-white/90"
                disabled={tokens < TOKENS_PER_KES_DISCOUNT}
                onClick={() => {
                  toast({
                    title: "Use your tokens at checkout (coming soon)",
                    description: `You have ${tokens} tokens worth ${KES(kesDiscount)}.`,
                  });
                  onNavigate("basket");
                }}
              >
                <Sparkles size={14} /> Redeem tokens
              </Button>
            </div>
          </div>

          {/* Upload section */}
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold-dark">
                <ScanLine size={16} />
              </span>
              <h3 className="text-sm font-bold">Upload a receipt</h3>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group relative grid h-[120px] w-[120px] shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-brand hover:bg-brand-light/40"
                aria-label={dataUrl ? "Change receipt photo" : "Upload receipt photo"}
              >
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt="Receipt preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground transition-colors group-hover:text-brand">
                    <ImagePlus size={28} />
                    <span className="text-[10px] font-medium">Tap to upload</span>
                  </div>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload size={14} /> {dataUrl ? "Change" : "Upload"}
                  </Button>
                  {dataUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDataUrl(null);
                        setFileError(null);
                      }}
                    >
                      <X size={14} /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PNG, JPG or WEBP. Max 1.5MB. We read it with AI to confirm the
                  shop and total.
                </p>
              </div>
            </div>

            {fileError && <p className="text-xs text-destructive">{fileError}</p>}

            <Button
              type="button"
              className="w-full bg-brand text-white hover:bg-brand-dark"
              disabled={!dataUrl || uploading || !phoneValid}
              onClick={handleSubmit}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Reading your
                  receipt…
                </>
              ) : (
                <>
                  <Receipt size={16} /> Submit receipt
                </>
              )}
            </Button>

            {/* VLM extraction confirmation */}
            {lastResult && (
              <div className="rounded-xl border border-brand/30 bg-brand-light/60 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand">
                  <CheckCircle2 size={14} /> Receipt read by AI
                </div>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                  <ExtractField
                    icon={<Store size={12} />}
                    label="Retailer"
                    value={lastResult.retailerName || "—"}
                  />
                  <ExtractField
                    icon={<Receipt size={12} />}
                    label="Total"
                    value={
                      lastResult.extractedTotal > 0
                        ? KES(lastResult.extractedTotal)
                        : "—"
                    }
                  />
                  <ExtractField
                    icon={<Calendar size={12} />}
                    label="Date"
                    value={
                      lastResult.receiptDate
                        ? new Date(lastResult.receiptDate).toLocaleDateString(
                            "en-KE",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"
                    }
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Pending admin approval for {RECEIPT_TOKENS_PER_UPLOAD} tokens.
                </p>
              </div>
            )}
          </Card>

          {/* How it works */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-bold">How it works</h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                Snap any physical shop receipt → WeBizzle reads it with AI → earn{" "}
                <span className="font-semibold text-brand">
                  {RECEIPT_TOKENS_PER_UPLOAD} tokens
                </span>{" "}
                per approved receipt →{" "}
                <span className="font-semibold text-brand">
                  {TOKENS_PER_KES_DISCOUNT} tokens = {KES(TOKENS_PER_KES_DISCOUNT)}
                </span>{" "}
                off your next order.
              </p>
              <div className="flex items-start gap-2 rounded-xl bg-gold/10 p-3 text-xs text-gold-dark">
                <Sparkles size={14} className="mt-0.5 shrink-0" />
                <span>
                  Your receipts help us track real neighbourhood prices so every
                  shopper saves more.
                </span>
              </div>
            </div>
          </Card>

          {/* My receipts list */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold">My receipts</h3>
                <p className="text-[11px] text-muted-foreground">
                  {receipts.length} submitted · {loadingList ? "loading…" : "live"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Approved tokens
                </div>
                <div className="text-lg font-extrabold text-brand">
                  {tokens}
                </div>
              </div>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading your
                receipts…
              </div>
            ) : receipts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="text-3xl" aria-hidden>
                  📭
                </div>
                <p className="text-sm text-muted-foreground">
                  No receipts yet. Upload one above to start earning tokens.
                </p>
              </div>
            ) : (
              <div className="max-h-96 divide-y divide-border overflow-y-auto wb-scroll">
                {receipts.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-light text-brand">
                          <Receipt size={14} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {r.retailerName || "Unknown retailer"}
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
                      </div>
                      <ReceiptStatusPill status={r.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                      <Field
                        icon={<Receipt size={12} />}
                        label="Total"
                        value={
                          r.extractedTotal > 0
                            ? KES(r.extractedTotal)
                            : "—"
                        }
                      />
                      <Field
                        icon={<Calendar size={12} />}
                        label="Receipt date"
                        value={
                          r.receiptDate
                            ? new Date(r.receiptDate).toLocaleDateString(
                                "en-KE",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"
                        }
                      />
                      <Field
                        icon={<Coins size={12} />}
                        label="Tokens"
                        value={String(r.tokensAwarded)}
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
              <div className="font-semibold">Spend your tokens</div>
              <div className="text-xs text-muted-foreground">
                {tokens >= TOKENS_PER_KES_DISCOUNT
                  ? `You have ${KES(kesDiscount)} ready at checkout.`
                  : `Upload ${TOKENS_PER_KES_DISCOUNT - tokens} more token(s) to unlock ${KES(TOKENS_PER_KES_DISCOUNT)} off.`}
              </div>
            </div>
            <Button
              className="bg-brand text-white hover:bg-brand-dark"
              disabled={tokens < TOKENS_PER_KES_DISCOUNT}
              onClick={() => {
                toast({
                  title: "Use your tokens at checkout (coming soon)",
                  description: `You have ${tokens} tokens worth ${KES(kesDiscount)}.`,
                });
                onNavigate("basket");
              }}
            >
              Redeem tokens <ArrowRight size={14} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ExtractField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 truncate font-semibold">{value}</div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-bold">{value}</div>
    </div>
  );
}

function ReceiptStatusPill({ status }: { status: string }) {
  const map: Record<
    string,
    { cls: string; label: string; icon: React.ReactNode }
  > = {
    PENDING: {
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
      label: "Pending",
      icon: <Loader2 size={11} className="animate-spin" />,
    },
    APPROVED: {
      cls: "bg-brand-light text-brand",
      label: "Approved",
      icon: <CheckCircle2 size={11} />,
    },
    REJECTED: {
      cls: "bg-destructive/10 text-destructive",
      label: "Rejected",
      icon: <AlertTriangle size={11} />,
    },
  };
  const entry =
    map[status] ||
    ({
      cls: "bg-muted text-muted-foreground",
      label: status,
      icon: null,
    } as { cls: string; label: string; icon: React.ReactNode });
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", entry.cls)}
    >
      {entry.icon}
      {entry.label}
    </Badge>
  );
}
