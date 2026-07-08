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
  TextField,
} from "@heroui/react";
import { ChevronLeft } from "@gravity-ui/icons";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log("[OWNER_REGISTER]", data);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/verify-email");
    }, 1000);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div>
          <Link className="mb-4 inline-flex items-center gap-1 text-sm" href="/login">
            <ChevronLeft className="size-4" />
            Quay lại đăng nhập
          </Link>
          <h1 className="text-2xl font-bold">Đăng ký tài khoản chủ sân</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tạo tài khoản để quản lý sân thể thao của bạn trên PlayCourt
          </p>
        </div>

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

          <TextField isRequired className="w-full" name="phone" type="tel">
            <Label>Số điện thoại</Label>
            <Input placeholder="0912 345 678" />
            <FieldError />
          </TextField>

          <TextField isRequired className="w-full" name="businessName">
            <Label>Tên cơ sở kinh doanh</Label>
            <Input placeholder="Sân thể thao ABC" />
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
              </Link>{" "}
              và{" "}
              <Link className="text-sm" href="#">
                Chính sách bảo mật
              </Link>
            </Checkbox.Content>
          </Checkbox>

          <Button className="w-full" isPending={isLoading} type="submit">
            Đăng ký tài khoản chủ sân
          </Button>
        </Form>

        <p className="text-center text-sm text-[var(--muted)]">
          Đã có tài khoản?{" "}
          <Link className="font-medium" href="/login">
            Đăng nhập
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
