import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayCourt - Dat San The Thao De Dang",
  description:
    "Tim va dat san the thao gan ban. Nhanh chong, de dang, tien loi. Ket noi doi thu, quan ly dat san moi luc moi noi.",
};

interface RootLayoutProps {
  children: ReactNode;
  auth?: ReactNode;
}

export default function RootLayout({ children, auth }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body
        className="antialiased min-h-full flex flex-col"
      >
        <Providers>
          {children}
          {auth}
        </Providers>
      </body>
    </html>
  );
}
