"use client";

import { type ReactNode } from "react";
import { Toast } from "@heroui/react";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toast.Provider placement="top end" maxVisibleToasts={3} />
    </AuthProvider>
  );
}
