"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Form,
  TextField,
  Input,
  Label,
  FieldError,
} from "@heroui/react";
import Lock from "@gravity-ui/icons/Lock";
import { AuthGuard } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { ChangePasswordRequestDto } from "@/lib/types/api";
import { SiteHeader } from "@/components/layout/site-header";

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

/* ------------------------------------------------------------------ */
/* CHANGE PASSWORD FORM                                                */
/* ------------------------------------------------------------------ */
function SettingsContent() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const body: ChangePasswordRequestDto = {
        currentPassword,
        newPassword,
      };

      await apiFetch("/Auth/change-password", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
          <p className="text-sm text-muted mt-1">
            Quản lý bảo mật tài khoản của bạn
          </p>
        </div>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-secondary)" }}
              >
                <Lock className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Đổi mật khẩu
                </h2>
                <p className="text-xs text-muted">
                  Cập nhật mật khẩu để bảo mật tài khoản
                </p>
              </div>
            </div>

            <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="w-full max-w-md">
                <TextField
                  type="password"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  isRequired
                  isDisabled={submitting}
                >
                  <Label>Mật khẩu hiện tại</Label>
                  <Input />
                  {fieldErrors.currentPassword && (
                    <FieldError>{fieldErrors.currentPassword}</FieldError>
                  )}
                </TextField>
              </div>

              <div className="w-full max-w-md">
                <TextField
                  type="password"
                  name="newPassword"
                  value={newPassword}
                  onChange={setNewPassword}
                  isRequired
                  isDisabled={submitting}
                >
                  <Label>Mật khẩu mới</Label>
                  <Input />
                  {fieldErrors.newPassword && (
                    <FieldError>{fieldErrors.newPassword}</FieldError>
                  )}
                </TextField>
              </div>

              <div className="w-full max-w-md">
                <TextField
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  isRequired
                  isDisabled={submitting}
                >
                  <Label>Xác nhận mật khẩu mới</Label>
                  <Input />
                  {fieldErrors.confirmPassword && (
                    <FieldError>{fieldErrors.confirmPassword}</FieldError>
                  )}
                </TextField>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={submitting}
                >
                  {submitting ? "Đang lưu..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </Form>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
