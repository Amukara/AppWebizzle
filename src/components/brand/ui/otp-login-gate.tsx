"use client";

import * as React from "react";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
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

type PortalKind = "vendor" | "rider";

interface OtpLoginGateProps {
  kind: PortalKind;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  placeholder: string;
  hint?: string;
  onVerified: (phone: string, token: string) => void;
  onBack?: () => void;
}

export function OtpLoginGate({
  kind,
  icon,
  title,
  subtitle,
  placeholder,
  hint,
  onVerified,
  onBack,
}: OtpLoginGateProps) {
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [resendTimer, setResendTimer] = React.useState(0);

  const purpose = kind === "vendor" ? "VENDOR_LOGIN" : "RIDER_LOGIN";

  // Countdown timer for resend
  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const sendOtp = React.useCallback(
    async (phoneVal?: string) => {
      const p = (phoneVal ?? phone).replace(/[\s\-\(\)]/g, "");
      if (!p || p.length < 10) {
        setError("Enter a valid phone number");
        return;
      }
      setLoading(true);
      setError(null);
      setDevCode(null);
      try {
        const res = await fetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: p, purpose }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to send OTP");
        }
        setPhone(p);
        setStep("otp");
        setOtp("");
        if (data.devCode) setDevCode(data.devCode);
        setResendTimer(60);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send OTP");
      } finally {
        setLoading(false);
      }
    },
    [phone, purpose]
  );

  const verifyOtp = React.useCallback(async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      onVerified(phone, data.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }, [phone, otp, purpose, onVerified]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10">
      <Card className="w-full p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 self-start text-muted-foreground"
              onClick={onBack}
            >
              <ArrowLeft size={14} /> Back
            </Button>
          )}
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand-light">
            {icon}
          </div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {step === "phone" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendOtp();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="otp-phone">Phone number</Label>
              <Input
                id="otp-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={placeholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
              {hint && (
                <p className="text-[11px] text-muted-foreground">{hint}</p>
              )}
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-brand text-white hover:bg-brand-dark"
              disabled={loading || phone.replace(/\s/g, "").length < 10}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending code…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Send verification code
                </>
              )}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">
                {phone.slice(0, 4)}***{phone.slice(-3)}
              </span>
            </p>

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
                  <span className="text-lg font-bold tracking-widest">
                    {devCode}
                  </span>
                </p>
              </div>
            )}

            {error && (
              <p className="text-center text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button
              className="w-full bg-brand text-white hover:bg-brand-dark"
              disabled={loading || otp.length !== 6}
              onClick={() => void verifyOtp()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying…
                </>
              ) : (
                <>Verify &amp; enter portal</>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-brand hover:underline disabled:text-muted-foreground disabled:no-underline"
                disabled={resendTimer > 0 || loading}
                onClick={() => void sendOtp(phone)}
              >
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : "Didn't get it? Resend code"}
              </button>
            </div>

            <button
              type="button"
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
                setDevCode(null);
              }}
            >
              Change phone number
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}