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
  Modal,
  Separator,
  Tabs,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useRouter } from "next/navigation";

export default function AuthModalPage() {
  const router = useRouter();
  const state = useOverlayState();
  const [tab, setTab] = useState<"login" | "register">("login");

  const handleClose = () => {
    state.close();
    router.back();
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Heading>
                {tab === "login" ? "Đăng nhập" : "Đăng ký"}
              </Modal.Heading>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {tab === "login"
                  ? "Chào mừng trở lại! Vui lòng đăng nhập."
                  : "Tạo tài khoản mới để bắt đầu."}
              </p>
            </Modal.Header>

            <Modal.Body>
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

                <Tabs.Panel className="pt-4" id="login">
                  <QuickLoginForm onSuccess={handleClose} />
                </Tabs.Panel>

                <Tabs.Panel className="pt-4" id="register">
                  <QuickRegisterForm
                    onSuccess={() => {
                      handleClose();
                      router.push("/verify-email");
                    }}
                  />
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>

            <Modal.Footer className="flex-col items-center">
              <Separator />
              <p className="text-center text-xs text-[var(--muted)]">
                Bạn là chủ sân?{" "}
                <Link
                  className="text-sm font-medium"
                  href="/register/owner"
                  onPress={handleClose}
                >
                  Đăng ký tài khoản chủ sân
                </Link>
              </p>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/* ───── Quick Login Form ───── */

function QuickLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log("[QUICK_LOGIN]", data);
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

/* ───── Quick Register Form ───── */

function QuickRegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log("[QUICK_REGISTER]", data);
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
