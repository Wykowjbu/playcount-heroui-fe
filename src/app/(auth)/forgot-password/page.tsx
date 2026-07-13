"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FieldError, Form, Input, Label, Link, TextField } from "@heroui/react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { apiFetch } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setLoading(true);
    setError("");
    try {
      await apiFetch("/Auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi mã đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-muted">Nhập email để nhận mã OTP đặt lại mật khẩu.</p>
        </div>
        {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
        <Form className="space-y-4" onSubmit={submit}>
          <TextField isRequired className="w-full" name="email" type="email">
            <Label>Email</Label><Input placeholder="name@example.com" /><FieldError />
          </TextField>
          <Button className="w-full" type="submit" isPending={loading}>Gửi mã OTP</Button>
        </Form>
        <Link href="/login" className="text-sm">Quay lại đăng nhập</Link>
      </div>
    </AuthLayout>
  );
}
