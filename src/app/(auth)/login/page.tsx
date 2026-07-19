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
  toast,
  Tabs,
} from "@heroui/react";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">
            {tab === "login" ? "Chào mừng trở lại" : "Tạo tài khoản PlayCourt"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {tab === "login"
              ? "Đăng nhập để tiếp tục sử dụng PlayCourt"
              : "Đặt sân và tìm đối thủ phù hợp chỉ trong vài phút"}
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

          <div className="overflow-hidden pt-6">
            <Tabs.Panel className="pt-0" id="login">
              <LoginForm />
            </Tabs.Panel>

            <Tabs.Panel className="pt-0" id="register">
              <RegisterForm />
            </Tabs.Panel>
          </div>
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
  const { loginWithRedirect } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const redirectTo = new URLSearchParams(window.location.search).get("redirect") ?? undefined;
      await loginWithRedirect({ identifier: data.email as string, password: data.password as string }, redirectTo);
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField isRequired className="w-full" name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="name@example.com" />
        <FieldError />
      </TextField>

      <PasswordField name="password" label="Mật khẩu" />

      <div className="flex items-center justify-between">
        <Checkbox name="remember">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            Ghi nhớ đăng nhập
          </Checkbox.Content>
        </Checkbox>
        <Link className="text-sm" href="/forgot-password">
          Quên mật khẩu?
        </Link>
      </div>

      <Button className="w-full" size="lg" isPending={isLoading} type="submit">
        {isLoading ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </Form>
  );
}

/* ───── Register Form ───── */

function RegisterForm() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.password !== data.confirmPassword) {
      toast.danger("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }
    try {
      await register({
        email: data.email as string,
        password: data.password as string,
        fullName: data.fullName as string,
        phoneNumber: data.phoneNumber as string,
        role: "Player",
      });
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setIsLoading(false);
    }
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

      <TextField isRequired className="w-full" name="phoneNumber">
        <Label>Số điện thoại</Label>
        <Input placeholder="0901234567" />
        <FieldError />
      </TextField>

      <PasswordField
        isRequired
        minLength={6}
        name="password"
        label="Mật khẩu"
        validate={(v) =>
          v.length < 6 ? "Mật khẩu phải có ít nhất 6 ký tự" : null
        }
      />
      <Description className="-mt-3 text-sm">Tối thiểu 6 ký tự</Description>

      <PasswordField
        isRequired
        name="confirmPassword"
        label="Xác nhận mật khẩu"
      />

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

      <Button className="w-full" size="lg" isPending={isLoading} type="submit">
        {isLoading ? "Đang đăng ký…" : "Đăng ký"}
      </Button>
    </Form>
  );
}

function PasswordField({ label, ...props }: React.ComponentProps<typeof TextField> & { label: string }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <TextField className="w-full" type={isVisible ? "text" : "password"} {...props}>
      <Label>{label}</Label>
      <Input placeholder="••••••••" />
      <Button
        aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="-mt-10 ml-auto mr-1"
        isIconOnly
        size="sm"
        variant="ghost"
        onPress={() => setIsVisible((value) => !value)}
      >
        {isVisible ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
      </Button>
      <FieldError />
    </TextField>
  );
}
