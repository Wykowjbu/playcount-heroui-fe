"use client";

import { Link } from "@heroui/react";
import { ArrowRight, ChevronLeft } from "@gravity-ui/icons";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const BRAND_FEATURES = [
  "Tìm sân thể thao gần bạn",
  "Đặt sân nhanh chóng, dễ dàng",
  "Kết nối với đối thủ cùng trình độ",
  "Quản lý đặt sân mọi lúc mọi nơi",
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel - hidden on mobile */}
      <div className="hidden w-2/5 flex-col justify-between bg-[var(--accent)] p-10 lg:flex">
        <div>
          <Link className="text-2xl font-bold text-white no-underline" href="/">
            PlayCourt
          </Link>
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Nền tảng đặt sân
            <br />
            thể thao hàng đầu
          </h1>
          <ul className="space-y-3">
            {BRAND_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <ArrowRight className="size-4 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/50">
          © 2026 PlayCourt. Tất cả quyền được bảo lưu.
        </p>
      </div>

      {/* Right form area */}
      <div className="flex w-full flex-col lg:w-3/5">
        <div className="mx-auto w-full max-w-md p-6 lg:px-0">
          <Link className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]" href="/">
            <ChevronLeft className="size-4" />
            Về trang chủ
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pb-12 pt-8 lg:items-center lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
