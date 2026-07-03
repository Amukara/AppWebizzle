"use client";

import { useRef, useState, useCallback } from "react";
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
  Camera,
  MapPin,
  Hash,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { PageHead } from "./orders";
import { useToast } from "@/hooks/use-toast";

/* ================================================================
   SUPPORT PAGE (unchanged)
   ================================================================ */
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

/* ================================================================
   VENDOR SIGNUP — with inline OTP verification + portal redirect
   ================================================================ */
export function VendorSignupPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [values, setValues] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const { toast } = useToast();

  const canSubmit =
    fields.every((f) => (values[f.id] || "").trim().length > 1) && !loading;

  // Countdown timer for resend
  const startResendTimer = useCallback(() => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
  }, []);

  // Step 1: Submit vendor application
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (logo) payload.logo = logo;
      for (const d of vendorDocs) {
        if (docFiles[d.id]) payload[d.id] = docFiles[d.id];
      }
      const res = await fetch("/api/applications/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        return;
      }
      toast({ title: "Application submitted!", description: data.message });
      // Now send OTP and move to verification step
      setStep("otp");
      setOtpLoading(true);
      try {
        const otpRes = await fetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: values.phone, purpose: "VENDOR_SIGNUP" }),
        });
        const otpData = await otpRes.json();
        if (!otpRes.ok) {
          setOtpError(otpData.error || "Failed to send verification code");
          setStep("form"); // go back
          return;
        }
        if (otpData.devCode) setDevCode(otpData.devCode);
        startResendTimer();
      } catch {
        setOtpError("Failed to send verification code. You can still log in from the portal.");
      } finally {
        setOtpLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and redirect to vendor portal
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.phone, purpose: "VENDOR_SIGNUP", code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Verification failed");
        return;
      }
      // Store portal token for the vendor portal
      if (data.token) {
        try { sessionStorage.setItem("wb_vendor_portal_token", data.token); } catch {}
      }
      setStep("done");
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    setDevCode(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.phone, purpose: "VENDOR_SIGNUP" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Failed to resend code");
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      startResendTimer();
    } catch {
      setOtpError("Failed to resend code");
    } finally {
      setOtpLoading(false);
    }
  };

  // DONE state — redirect to portal
  if (step === "done") {
    return (
      <div className="mx-auto max-w-md space-y-5 py-4">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100">
            <CheckCircle2 className="text-green-600" size={36} />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">Verified &amp; registered!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your vendor account is set up. Our team will review your documents within 24 hours and call you to set up your catalogue.
          </p>
        </div>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Application reference</div>
          <div className="font-mono text-sm font-bold">
            WB-{Date.now().toString(36).toUpperCase().slice(-6)}
          </div>
        </Card>
        <Button
          className="w-full bg-brand text-white hover:bg-brand-dark"
          onClick={() => onNavigate("vendor-portal")}
        >
          <Store size={16} /> Go to Vendor Portal
        </Button>
      </div>
    );
  }

  // OTP verification step
  if (step === "otp") {
    const maskedPhone = values.phone
      ? `${values.phone.slice(0, 4)}***${values.phone.slice(-3)}`
      : "your phone";
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10">
        <Card className="w-full p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <button
              variant="ghost"
              size="sm"
              className="mb-2 self-start text-muted-foreground hover:text-foreground"
              onClick={() => { setStep("form"); setOtp(""); setOtpError(null); setDevCode(null); }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand-light">
              <ShieldCheck className="text-brand" size={28} />
            </div>
            <h1 className="text-xl font-bold text-foreground">Verify your phone</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{maskedPhone}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={() => void verifyOtp()}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {devCode && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center">
                <p className="text-[11px] font-medium text-amber-700">
                  Dev mode — code:{" "}
                  <span className="text-lg font-bold tracking-widest">{devCode}</span>
                </p>
              </div>
            )}

            {otpError && (
              <p className="text-center text-sm font-medium text-destructive">{otpError}</p>
            )}

            <Button
              className="w-full bg-brand text-white hover:bg-brand-dark"
              disabled={otpLoading || otp.length !== 6}
              onClick={() => void verifyOtp()}
            >
              {otpLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Verifying...</>
              ) : (
                "Verify &amp; enter portal"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-brand hover:underline disabled:text-muted-foreground disabled:no-underline"
                disabled={resendTimer > 0 || otpLoading}
                onClick={() => void resendOtp()}
              >
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : "Didn't get it? Resend code"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // FORM step (default)
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHead
        icon={<Store className="text-brand" size={24} />}
        title="Register your shop"
        desc="List your duka, Mama Mboga or pharmacy on WeBizzle. Upload your verification documents to get approved faster."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <Card className="space-y-4 p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand text-white text-[11px] font-bold">1</span>
            <span>Fill in your details</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-[11px]">2</span>
            <span>Verify phone &amp; enter portal</span>
          </div>

          <LogoUploader value={logo} onChange={setLogo} />

          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={`vendor-${f.id}`} className="flex items-center gap-1.5">
                {f.icon} {f.label}
              </Label>
              <Input
                id={`vendor-${f.id}`}
                placeholder={f.placeholder}
                value={values[f.id] || ""}
                onChange={(e) => setValues({ ...values, [f.id]: e.target.value })}
              />
            </div>
          ))}

          {/* Verification documents */}
          <div className="space-y-3 rounded-xl bg-brand-light/30 p-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-brand">
              <FileCheck2 size={14} /> Verification documents
              <span className="font-normal text-muted-foreground">(upload to fast-track approval)</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {vendorDocs.map((d) => (
                <DocUploader
                  key={d.id}
                  label={d.label}
                  hint={d.hint}
                  value={docFiles[d.id] || null}
                  onChange={(v) => setDocFiles((prev) => ({ ...prev, [d.id]: v || "" }))}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            className="w-full bg-brand text-white hover:bg-brand-dark"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            ) : (
              <><Send size={16} /> Submit &amp; verify phone</>
            )}
          </Button>
        </Card>

        {/* Perks sidebar */}
        <Card className="h-fit space-y-2 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            What you get
          </h4>
          {[
            { icon: <Store size={14} />, text: "Free to join — no setup fees" },
            { icon: <ShieldCheck size={14} />, text: "Get paid instantly via M-Pesa" },
            { icon: <Clock size={14} />, text: "Manage orders from your phone" },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground">
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

/* ================================================================
   RIDER SIGNUP — with stage, selfie, bike reg + inline OTP + portal redirect
   ================================================================ */
export function RiderSignupPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [values, setValues] = useState<Record<string, string>>({});
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const riderFields = [
    { id: "fullName", label: "Full name", icon: <User size={14} />, placeholder: "e.g. Peter Mutua" },
    { id: "phone", label: "Phone (M-Pesa)", icon: <Phone size={14} />, placeholder: "07XXXXXXXX" },
    { id: "bikePlate", label: "Bike registration number", icon: <Bike size={14} />, placeholder: "e.g. KMEA 224B" },
    { id: "stageNumber", label: "Stage number", icon: <Hash size={14} />, placeholder: "e.g. Stage 14, Matatu terminus" },
    { id: "locationArea", label: "Location / area", icon: <MapPin size={14} />, placeholder: "e.g. Webuye, Westlands, Wendani" },
  ];

  const canSubmit =
    riderFields.every((f) => (values[f.id] || "").trim().length > 1) && !loading;

  // Countdown timer
  const startResendTimer = useCallback(() => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
  }, []);

  // Camera functions
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setError("Camera access denied. Please allow camera or upload a photo instead.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    // Check size (~1MB limit)
    if (dataUrl.length > 1_500_000) {
      setError("Selfie too large. Try with better lighting or upload a smaller image.");
      return;
    }
    setSelfie(dataUrl);
    closeCamera();
    setError(null);
  };

  const handleSelfieFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }
    if (file.size > 1_500_000) {
      setError("Selfie too large. Keep it under 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelfie(reader.result as string);
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsDataURL(file);
  };

  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Submit rider application
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        fullName: values.fullName,
        phone: values.phone,
        bikePlate: values.bikePlate,
        stageNumber: values.stageNumber,
        locationArea: values.locationArea,
        selfieUrl: selfie,
      };
      const res = await fetch("/api/applications/rider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        return;
      }
      toast({ title: "Application submitted!", description: data.message });
      // Send OTP and move to verification step
      setStep("otp");
      setOtpLoading(true);
      try {
        const otpRes = await fetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: values.phone, purpose: "RIDER_SIGNUP" }),
        });
        const otpData = await otpRes.json();
        if (!otpRes.ok) {
          setOtpError(otpData.error || "Failed to send verification code");
          setStep("form");
          return;
        }
        if (otpData.devCode) setDevCode(otpData.devCode);
        startResendTimer();
      } catch {
        setOtpError("Failed to send code. You can still log in from the portal.");
      } finally {
        setOtpLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and redirect to rider portal
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.phone, purpose: "RIDER_SIGNUP", code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Verification failed");
        return;
      }
      if (data.token) {
        try { sessionStorage.setItem("wb_rider_portal_token", data.token); } catch {}
      }
      setStep("done");
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    setDevCode(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.phone, purpose: "RIDER_SIGNUP" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Failed to resend code");
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      startResendTimer();
    } catch {
      setOtpError("Failed to resend code");
    } finally {
      setOtpLoading(false);
    }
  };

  // DONE state
  if (step === "done") {
    return (
      <div className="mx-auto max-w-md space-y-5 py-4">
        <div className="flex flex-col items-center text-center">
          {selfie ? (
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-green-200">
              <img src={selfie} alt="Your selfie" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100">
              <CheckCircle2 className="text-green-600" size={36} />
            </div>
          )}
          <h1 className="mt-3 text-2xl font-extrabold">Verified &amp; registered!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome aboard! We&apos;ll verify your details and reach out once onboarding opens in your area.
          </p>
        </div>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Application reference</div>
          <div className="font-mono text-sm font-bold">
            WB-{Date.now().toString(36).toUpperCase().slice(-6)}
          </div>
        </Card>
        <Button
          className="w-full bg-brand text-white hover:bg-brand-dark"
          onClick={() => onNavigate("rider-portal")}
        >
          <Bike size={16} /> Go to Rider Portal
        </Button>
      </div>
    );
  }

  // OTP step
  if (step === "otp") {
    const maskedPhone = values.phone
      ? `${values.phone.slice(0, 4)}***${values.phone.slice(-3)}`
      : "your phone";
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10">
        <Card className="w-full p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <button
              type="button"
              className="mb-2 self-start text-muted-foreground hover:text-foreground"
              onClick={() => { setStep("form"); setOtp(""); setOtpError(null); setDevCode(null); }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand-light">
              <ShieldCheck className="text-brand" size={28} />
            </div>
            <h1 className="text-xl font-bold text-foreground">Verify your phone</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{maskedPhone}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={() => void verifyOtp()}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {devCode && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center">
                <p className="text-[11px] font-medium text-amber-700">
                  Dev mode — code:{" "}
                  <span className="text-lg font-bold tracking-widest">{devCode}</span>
                </p>
              </div>
            )}

            {otpError && (
              <p className="text-center text-sm font-medium text-destructive">{otpError}</p>
            )}

            <Button
              className="w-full bg-brand text-white hover:bg-brand-dark"
              disabled={otpLoading || otp.length !== 6}
              onClick={() => void verifyOtp()}
            >
              {otpLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Verifying...</>
              ) : (
                "Verify &amp; enter portal"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-brand hover:underline disabled:text-muted-foreground disabled:no-underline"
                disabled={resendTimer > 0 || otpLoading}
                onClick={() => void resendOtp()}
              >
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : "Didn't get it? Resend code"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // FORM step (default)
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHead
        icon={<Bike className="text-brand" size={24} />}
        title="Become a rider"
        desc="Deliver in your neighbourhood and earn on every trip. Flexible hours, weekly M-Pesa payouts."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <Card className="space-y-4 p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand text-white text-[11px] font-bold">1</span>
            <span>Fill in your details &amp; take selfie</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-[11px]">2</span>
            <span>Verify phone &amp; enter portal</span>
          </div>

          {/* Text fields */}
          {riderFields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={`rider-${f.id}`} className="flex items-center gap-1.5">
                {f.icon} {f.label}
              </Label>
              <Input
                id={`rider-${f.id}`}
                placeholder={f.placeholder}
                value={values[f.id] || ""}
                onChange={(e) => setValues({ ...values, [f.id]: e.target.value })}
                type={f.id === "phone" ? "tel" : "text"}
                inputMode={f.id === "phone" ? "tel" : undefined}
              />
            </div>
          ))}

          {/* Selfie capture section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Camera size={14} /> Selfie photo{" "}
              <span className="font-normal text-muted-foreground">(required for verification)</span>
            </Label>

            {cameraOpen && (
              <div className="space-y-3 rounded-xl border-2 border-brand/40 bg-black/5 p-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg object-cover"
                  style={{ maxHeight: 280 }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-brand text-white hover:bg-brand-dark"
                    onClick={captureSelfie}
                  >
                    <Camera size={14} /> Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={closeCamera}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!cameraOpen && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={openCamera}
                  className="group relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-brand hover:bg-brand-light/40"
                  aria-label="Take selfie"
                >
                  {selfie ? (
                    <img src={selfie} alt="Your selfie" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="text-muted-foreground transition-colors group-hover:text-brand" size={24} />
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-brand">
                        Camera
                      </span>
                    </div>
                  )}
                </button>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openCamera}
                      disabled={cameraOpen}
                    >
                      <Camera size={14} /> {selfie ? "Retake" : "Take selfie"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selfieInputRef.current?.click()}
                    >
                      <Upload size={14} /> Upload
                    </Button>
                    {selfie && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelfie(null)}
                      >
                        <X size={14} /> Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    PNG, JPG or WEBP. Max 1MB. This helps us verify your identity.
                  </p>
                </div>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelfieFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            className="w-full bg-brand text-white hover:bg-brand-dark"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            ) : (
              <><Send size={16} /> Submit &amp; verify phone</>
            )}
          </Button>
        </Card>

        {/* Perks sidebar */}
        <Card className="h-fit space-y-2 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            What you get
          </h4>
          {[
            { icon: <Bike size={14} />, text: "Earn per delivery + tips" },
            { icon: <Clock size={14} />, text: "Choose your own hours" },
            { icon: <ShieldCheck size={14} />, text: "Weekly M-Pesa payouts" },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground">
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

/* ================================================================
   SHARED COMPONENTS
   ================================================================ */
const fields = [
  { id: "shopName", label: "Shop name", icon: <Store size={14} />, placeholder: "e.g. Baraka General Store" },
  { id: "ownerName", label: "Owner name", icon: <User size={14} />, placeholder: "e.g. John Mwangi" },
  { id: "phone", label: "Phone (M-Pesa)", icon: <Phone size={14} />, placeholder: "07XXXXXXXX" },
];

const vendorDocs = [
  { id: "tradeLicense", label: "Trade licence", hint: "County trade licence photo" },
  { id: "municipalLicense", label: "Municipal / SBP", hint: "Single business permit" },
  { id: "kplcToken", label: "KPLC token receipt", hint: "Proves your premises" },
];

function LogoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX_BYTES = 800 * 1024;

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
            <img src={value} alt="Shop logo preview" className="h-full w-full object-cover" />
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
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload size={14} /> {value ? "Change" : "Upload"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(null); setError(null); }}>
                <X size={14} /> Remove
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">PNG, JPG or WEBP. Max 800KB.</p>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

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
  const MAX_BYTES = 1024 * 1024;

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
            onClick={() => { onChange(null); setError(null); }}
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