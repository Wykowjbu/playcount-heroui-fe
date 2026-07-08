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
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

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

          <Tabs.Panel className="pt-6" id="login">
            <LoginForm onSuccess={() => router.push("/")} />
          </Tabs.Panel>

          <Tabs.Panel className="pt-6" id="register">
            <RegisterForm onSuccess={() => router.push("/verify-email")} />
          </Tabs.Panel>
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

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log("[LOGIN]", data);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1000);
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log("[REGISTER]", data);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1000);
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
