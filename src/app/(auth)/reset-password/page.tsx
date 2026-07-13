"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, FieldError, Form, Input, InputOTP, Label, Link, Spinner, TextField } from "@heroui/react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { apiFetch } from "@/lib/api/client";

export default function ResetPasswordPage() {
  return <Suspense fallback={<Spinner />}><ResetPasswordForm /></Suspense>;
}

function ResetPasswordForm() {
  const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword !== data.get("confirmPassword")) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/Auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
        skipAuth: true,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div><h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1><p className="mt-1 text-sm text-muted">Nhập OTP đã gửi đến {email || "email của bạn"}.</p></div>
        {success ? (
          <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Description>Đổi mật khẩu thành công. <Link href="/login">Đăng nhập</Link></Alert.Description></Alert.Content></Alert>
        ) : (
          <Form className="space-y-4" onSubmit={submit}>
            {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
            <div className="space-y-2"><Label>Mã OTP</Label><InputOTP maxLength={6} value={otp} onChange={setOtp}><InputOTP.Group>{[0,1,2,3,4,5].map((index) => <InputOTP.Slot index={index} key={index} />)}</InputOTP.Group></InputOTP></div>
            <TextField isRequired className="w-full" minLength={6} name="newPassword" type="password"><Label>Mật khẩu mới</Label><Input /><FieldError /></TextField>
            <TextField isRequired className="w-full" name="confirmPassword" type="password"><Label>Xác nhận mật khẩu</Label><Input /><FieldError /></TextField>
            <Button className="w-full" type="submit" isDisabled={otp.length !== 6} isPending={loading}>Đặt lại mật khẩu</Button>
          </Form>
        )}
      </div>
    </AuthLayout>
  );
}
