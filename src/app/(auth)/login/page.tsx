"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  Separator,
  TextField,
  Tabs,
} from "@heroui/react";
import { motion, useReducedMotion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const shouldReduceMotion = useReducedMotion();

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: "easeOut" as const };

  const panelInitial = shouldReduceMotion
    ? false
    : { opacity: 0, y: 8 };

  const panelAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Chào mừng trở lại</h1>
          <p className="text-sm text-[var(--muted)]">
            Đăng nhập để tiếp tục sử dụng PlayCourt
          </p>
        </div>

        <Tabs
          className="w-full"
          selectedKey={tab}
          onSelectionChange={(k) => setTab(k as "login" | "register")}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Chọn phương thức">
              <Tabs.Tab id="login">
                Đăng nhập
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="register">
                Đăng ký
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <motion.div layout className="overflow-hidden pt-6" transition={panelTransition}>
            <Tabs.Panel className="pt-0" id="login">
              <motion.div
                key={`login-${tab === "login" ? "active" : "inactive"}`}
                initial={panelInitial}
                animate={panelAnimate}
                transition={panelTransition}
              >
                <LoginForm />
              </motion.div>
            </Tabs.Panel>

            <Tabs.Panel className="pt-0" id="register">
              <motion.div
                key={`register-${tab === "register" ? "active" : "inactive"}`}
                initial={panelInitial}
                animate={panelAnimate}
                transition={panelTransition}
              >
                <RegisterForm />
              </motion.div>
            </Tabs.Panel>
          </motion.div>
        </Tabs>

        <Separator />

        <p className="text-center text-xs text-[var(--muted)]">
          Bạn là chủ sân?{" "}
          <Link className="text-sm font-medium" href="/register/owner">
            Đăng ký tài khoản chủ sân
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ───── Login Form ───── */

function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await login({ identifier: data.email as string, password: data.password as string });
    } catch (err: unknown) {
      const msg = err instanceof ApiError && err.errors.length > 0
        ? err.errors[0]
        : err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <TextField isRequired className="w-full" name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="name@example.com" />
        <FieldError />
      </TextField>

      <TextField isRequired className="w-full" name="password" type="password">
        <Label>Mật khẩu</Label>
        <Input placeholder="••••••••" />
        <FieldError />
      </TextField>

      <div className="flex items-center justify-between">
        <Checkbox name="remember">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            Ghi nhớ đăng nhập
          </Checkbox.Content>
        </Checkbox>
        <Link className="text-sm" href="#">
          Quên mật khẩu?
        </Link>
      </div>

      <Button className="w-full" isPending={isLoading} type="submit">
        Đăng nhập
      </Button>
    </Form>
  );
}

/* ───── Register Form ───── */

function RegisterForm() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await register({
        email: data.email as string,
        password: data.password as string,
        fullName: data.fullName as string,
        phoneNumber: data.phoneNumber as string,
        role: "Player",
      });
    } catch (err: unknown) {
      const msg = err instanceof ApiError && err.errors.length > 0
        ? err.errors[0]
        : err instanceof Error ? err.message : "Đăng ký thất bại";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <TextField isRequired className="w-full" name="fullName">
        <Label>Họ và tên</Label>
        <Input placeholder="Nguyễn Văn A" />
        <FieldError />
      </TextField>

      <TextField isRequired className="w-full" name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="name@example.com" />
        <FieldError />
      </TextField>

      <TextField isRequired className="w-full" name="phoneNumber">
        <Label>Số điện thoại</Label>
        <Input placeholder="0901234567" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        className="w-full"
        minLength={6}
        name="password"
        type="password"
        validate={(v) =>
          v.length < 6 ? "Mật khẩu phải có ít nhất 6 ký tự" : null
        }
      >
        <Label>Mật khẩu</Label>
        <Input placeholder="••••••••" />
        <Description>Tối thiểu 6 ký tự</Description>
        <FieldError />
      </TextField>

      <TextField
        isRequired
        className="w-full"
        name="confirmPassword"
        type="password"
      >
        <Label>Xác nhận mật khẩu</Label>
        <Input placeholder="••••••••" />
        <FieldError />
      </TextField>

      <Checkbox isRequired name="terms">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Tôi đồng ý với{" "}
          <Link className="text-sm" href="#">
            Điều khoản sử dụng
          </Link>
        </Checkbox.Content>
      </Checkbox>

      <Button className="w-full" isPending={isLoading} type="submit">
        Đăng ký
      </Button>
    </Form>
  );
}
