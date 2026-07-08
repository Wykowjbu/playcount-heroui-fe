import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
      >
        {children}
        {auth}
      </body>
    </html>
  );
}
