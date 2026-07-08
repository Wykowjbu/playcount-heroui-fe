"use client";

import { useState } from "react";
import { Button, InputOTP, Label, Link, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  const maskedEmail = "a****@gmail.com";

  const handleVerify = () => {
    if (otp.length < 6) {
      setError("Vui lòng nhập đầy đủ mã OTP");
      return;
    }
    setError("");
    setIsLoading(true);
    console.log("[VERIFY_OTP]", { code: otp });
    setTimeout(() => {
      setIsLoading(false);
      router.push("/login");
    }, 1000);
  };

  const handleResend = () => {
    setIsResending(true);
    console.log("[RESEND_OTP]");
    setTimeout(() => {
      setIsResending(false);
    }, 1000);
  };

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
          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}
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
            isDisabled={isResending}
            isPending={isResending}
            size="sm"
            variant="ghost"
            onPress={handleResend}
          >
            Gửi lại mã
          </Button>
        </div>

        <Link className="text-sm" href="/login">
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
