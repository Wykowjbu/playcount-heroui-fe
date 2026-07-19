"use client";

import { useState, useEffect, Suspense } from "react";
import { Button, InputOTP, Label, Link, Spinner, toast } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { apiFetch } from "@/lib/api/client";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const maskedEmail = emailFromQuery
    ? emailFromQuery.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "****@****";

  async function handleVerify() {
    if (otp.length < 6) {
      toast.danger("Vui lòng nhập đầy đủ mã OTP");
      return;
    }
    setIsLoading(true);
    try {
      await apiFetch("/Auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: emailFromQuery, otp }),
        skipAuth: true,
      });
      router.push("/login");
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!emailFromQuery) {
      toast.danger("Không có email. Vui lòng quay lại đăng ký.");
      return;
    }
    setIsResending(true);
    try {
      await apiFetch("/Auth/resend-verify-email", {
        method: "POST",
        body: JSON.stringify({ email: emailFromQuery }),
        skipAuth: true,
      });
      setResendCooldown(60);
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout>
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Xác minh email của bạn</h1>
          <p className="text-sm text-[var(--muted)]">
            Chúng tôi đã gửi mã xác minh đến{" "}
            <span className="font-medium text-[var(--foreground)]">
              {maskedEmail}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Label>Nhập mã OTP</Label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
            </InputOTP.Group>
          </InputOTP>
        </div>

        <Button
          className="w-full max-w-xs"
          isPending={isLoading}
          onPress={handleVerify}
        >
          {isLoading ? <Spinner size="sm" /> : "Xác minh"}
        </Button>

        <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
          <span>Không nhận được mã?</span>
          <Button
            isDisabled={isResending || resendCooldown > 0}
            isPending={isResending}
            size="sm"
            variant="ghost"
            onPress={handleResend}
          >
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã"}
          </Button>
        </div>

        <Link className="text-sm" href="/login">
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
