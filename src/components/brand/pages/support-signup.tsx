"use client";

import { useRef, useState } from "react";
import {
  LifeBuoy,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Store,
  Bike,
  User,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Send,
  Upload,
  X,
  ImagePlus,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHead } from "./orders";
import { useToast } from "@/hooks/use-toast";

export function SupportPage() {
  return (
    <div className="space-y-5">
      <PageHead
        icon={<LifeBuoy className="text-brand" size={24} />}
        title="Support"
        desc="We&apos;re here to help — chat with us on WhatsApp or browse quick answers."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <SupportCard
          icon={<MessageCircle className="text-mpesa" size={20} />}
          title="WhatsApp"
          desc="Fastest response — 7am to 10pm"
          cta="Chat now"
          href="https://wa.me/254731371521"
          accent="mpesa"
        />
        <SupportCard
          icon={<Phone className="text-brand" size={20} />}
          title="Call us"
          desc="0731 371 521"
          cta="Call now"
          href="tel:+254731371521"
          accent="brand"
        />
        <SupportCard
          icon={<Mail className="text-gold-dark" size={20} />}
          title="Email"
          desc="help@webizzle.co.ke"
          cta="Send email"
          href="mailto:help@webizzle.co.ke"
          accent="gold"
        />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-bold">Frequently asked</h3>
        <div className="mt-3 space-y-3 text-sm">
          <FAQ
            q="How long does delivery take?"
            a="Most orders arrive within 15–35 minutes depending on the vendor and your location. You'll see the estimated time before checkout."
          />
          <FAQ
            q="How do I pay?"
            a="All payments are made through M-Pesa. Enter your phone number at checkout and approve the STK prompt. We never store your PIN."
          />
          <FAQ
            q="Can I buy from multiple vendors?"
            a="Our Smart Basket compares every vendor and recommends the cheapest single-vendor option for one delivery fee. Split-basket checkout is coming soon."
          />
          <FAQ
            q="What if an item is missing?"
            a="Report it via WhatsApp within 2 hours and we'll refund or redeliver. Your M-Pesa code is your proof of purchase."
          />
        </div>
      </Card>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  desc,
  cta,
  href,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  accent: "brand" | "mpesa" | "gold";
}) {
  const bg =
    accent === "brand"
      ? "bg-brand-light text-brand"
      : accent === "mpesa"
        ? "bg-mpesa/10 text-mpesa"
        : "bg-gold/15 text-gold-dark";
  return (
    <Card className="flex flex-col items-start gap-3 p-4">
      <div className={"grid h-10 w-10 place-items-center rounded-xl " + bg}>
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link href={href} target="_blank" rel="noreferrer">
          {cta}
        </Link>
      </Button>
    </Card>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-3">
      <summary className="flex cursor-pointer items-center justify-between gap-2 font-medium list-none">
        {q}
        <span className="text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}

export function VendorSignupPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <SignupPage
      icon={<Store className="text-brand" size={24} />}
      title="Register your shop"
      desc="List your duka, Mama Mboga or pharmacy on WeBizzle. Upload your standing documents to verify ownership and get approved faster."
      accent="brand"
      endpoint="/api/applications/vendor"
      withLogo
      otpPurpose="VENDOR_SIGNUP"
      portalPage="vendor-portal"
      onNavigate={onNavigate}
      fields={[
        { id: "shopName", label: "Shop name", icon: <Store size={14} />, placeholder: "e.g. Baraka General Store" },
        { id: "ownerName", label: "Owner name", icon: <User size={14} />, placeholder: "e.g. John Mwangi" },
        { id: "phone", label: "Phone (M-Pesa)", icon: <Phone size={14} />, placeholder: "07XXXXXXXX" },
      ]}
      docs={[
        { id: "tradeLicense", label: "Trade licence", hint: "County trade licence photo" },
        { id: "municipalLicense", label: "Municipal / SBP", hint: "Single business permit" },
        { id: "kplcToken", label: "KPLC token receipt", hint: "Proves your premises" },
      ]}
      cta="Submit application"
      successTitle="Application received!"
      successDesc="Our team will review your verification documents within 24 hours and call you to set up your catalogue."
      perks={[
        { icon: <Store size={14} />, text: "Free to join — no setup fees" },
        { icon: <ShieldCheck size={14} />, text: "Get paid instantly via M-Pesa" },
        { icon: <Clock size={14} />, text: "Manage orders from your phone" },
      ]}
    />
  );
}

export function RiderSignupPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <SignupPage
      icon={<Bike className="text-brand" size={24} />}
      title="Become a rider"
      desc="Deliver in your neighbourhood and earn on every trip. Flexible hours, weekly M-Pesa payouts."
      accent="brand"
      endpoint="/api/applications/rider"
      otpPurpose="RIDER_SIGNUP"
      portalPage="rider-portal"
      onNavigate={onNavigate}
      fields={[
        { id: "fullName", label: "Full name", icon: <User size={14} />, placeholder: "e.g. Peter Mutua" },
        { id: "phone", label: "Phone (M-Pesa)", icon: <Phone size={14} />, placeholder: "07XXXXXXXX" },
        { id: "bikePlate", label: "Bike plate", icon: <Bike size={14} />, placeholder: "e.g. KMEA 224B" },
      ]}
      cta="Submit application"
      successTitle="Application received!"
      successDesc="We'll reach out once onboarding opens in your area. Keep your phone on."
      perks={[
        { icon: <Bike size={14} />, text: "Earn per delivery + tips" },
        { icon: <Clock size={14} />, text: "Choose your own hours" },
        { icon: <ShieldCheck size={14} />, text: "Weekly M-Pesa payouts" },
      ]}
    />
  );
}

function SignupPage({
  icon,
  title,
  desc,
  fields,
  endpoint,
  cta,
  successTitle,
  successDesc,
  perks,
  withLogo = false,
  docs = [],
  otpPurpose,
  portalPage,
  onNavigate,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: "brand";
  fields: { id: string; label: string; icon: React.ReactNode; placeholder: string }[];
  endpoint: string;
  cta: string;
  successTitle: string;
  successDesc: string;
  perks: { icon: React.ReactNode; text: string }[];
  withLogo?: boolean;
  docs?: { id: string; label: string; hint: string }[];
  otpPurpose?: string;
  portalPage?: string;
  onNavigate?: (p: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [signupPhone, setSignupPhone] = useState<string | null>(null);
  const { toast } = useToast();

  const canSubmit =
    fields.every((f) => (values[f.id] || "").trim().length > 1) && !loading;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (withLogo) payload.logo = logo;
      for (const d of docs) {
        if (docFiles[d.id]) payload[d.id] = docFiles[d.id];
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        return;
      }
      setDone(true);
      toast({
        title: "Application submitted!",
        description: data.message,
      });
      // Send OTP and redirect to portal if configured
      const phone = values.phone;
      if (otpPurpose && portalPage && onNavigate && phone) {
        setSignupPhone(phone);
        try {
          await fetch("/api/otp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, purpose: otpPurpose }),
          });
          setOtpSent(true);
        } catch {
          // OTP send failed — still redirect, they can request OTP at the portal
          onNavigate(portalPage);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-4">
        <div className="flex flex-col items-center text-center">
          {withLogo && logo ? (
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-border bg-card">
              <img src={logo} alt="Your shop logo" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-light">
              <CheckCircle2 className="text-brand" size={36} />
            </div>
          )}
          <h1 className="mt-3 text-2xl font-extrabold">{successTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{successDesc}</p>
        </div>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Reference</div>
          <div className="font-mono text-sm font-bold">
            WB-{Date.now().toString(36).toUpperCase().slice(-6)}
          </div>
        </Card>
        {otpSent && portalPage && onNavigate ? (
          <Button
            className="w-full bg-brand text-white hover:bg-brand-dark"
            onClick={() => onNavigate(portalPage)}
          >
            <ShieldCheck size={16} /> Continue to your portal
          </Button>
        ) : (
          <Button
            className="w-full bg-brand text-white hover:bg-brand-dark"
            onClick={() => {
              setDone(false);
              setValues({});
              setLogo(null);
              setDocFiles({});
              setOtpSent(false);
              setSignupPhone(null);
            }}
          >
            Submit another
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHead icon={icon} title={title} desc={desc} />
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <Card className="space-y-4 p-5">
          {withLogo && (
            <LogoUploader value={logo} onChange={setLogo} />
          )}
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id} className="flex items-center gap-1.5">
                {f.icon} {f.label}
              </Label>
              <Input
                id={f.id}
                placeholder={f.placeholder}
                value={values[f.id] || ""}
                onChange={(e) =>
                  setValues({ ...values, [f.id]: e.target.value })
                }
              />
            </div>
          ))}
          {docs.length > 0 && (
            <div className="space-y-3 rounded-xl bg-brand-light/30 p-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-brand">
                <FileCheck2 size={14} /> Verification documents
                <span className="font-normal text-muted-foreground">
                  (upload to fast-track approval)
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {docs.map((d) => (
                  <DocUploader
                    key={d.id}
                    label={d.label}
                    hint={d.hint}
                    value={docFiles[d.id] || null}
                    onChange={(v) =>
                      setDocFiles((prev) => ({ ...prev, [d.id]: v || "" }))
                    }
                  />
                ))}
              </div>
            </div>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <Button
            className="w-full bg-brand text-white hover:bg-brand-dark"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send size={16} /> {cta}
              </>
            )}
          </Button>
        </Card>

        <Card className="h-fit space-y-2 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            What you get
          </h4>
          {perks.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-light text-brand">
                {p.icon}
              </span>
              {p.text}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function LogoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX_BYTES = 800 * 1024; // 800KB

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Image is too large (${(file.size / 1024).toFixed(0)}KB). Keep it under 800KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError("Could not read the file. Please try another.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Store size={14} /> Shop logo{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-brand hover:bg-brand-light/40"
          aria-label={value ? "Change shop logo" : "Upload shop logo"}
        >
          {value ? (
            <img
              src={value}
              alt="Shop logo preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="text-muted-foreground transition-colors group-hover:text-brand" size={28} />
          )}
        </button>
        <div className="flex flex-col gap-2">
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} /> {value ? "Change" : "Upload"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                  setError(null);
                }}
              >
                <X size={14} /> Remove
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            PNG, JPG or WEBP. Max 800KB.
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Verification document uploader (trade licence, municipal permit, KPLC token)
function DocUploader({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX_BYTES = 1024 * 1024; // 1MB per doc

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Image file required.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Too large (${(file.size / 1024).toFixed(0)}KB). Max 1MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError("Could not read file.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-24 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed border-border bg-background transition-colors hover:border-brand hover:bg-brand-light/30"
        aria-label={`Upload ${label}`}
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            <ImagePlus className="text-muted-foreground transition-colors group-hover:text-brand" size={22} />
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-brand">
              {label}
            </span>
          </>
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
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[10px] text-muted-foreground">{hint}</span>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
            }}
            className="shrink-0 text-[10px] font-medium text-destructive hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
