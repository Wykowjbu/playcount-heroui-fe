"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicLandingView } from "./public-landing-view";
import { PlayerDiscoveryView } from "./player-discovery-view";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect Admin/Owner away from landing
  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "admin") {
      router.replace("/admin");
    } else if (user?.role === "owner") {
      router.replace("/owner");
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth (brief)
  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1" />
      </>
    );
  }

  // Admin/Owner: will redirect, show nothing
  if (user && (user.role === "admin" || user.role === "owner")) {
    return null;
  }

  // Player logged in → Discovery Home
  if (user && user.role === "player") {
    return (
      <>
        <SiteHeader />
        <PlayerDiscoveryView user={user} />
      </>
    );
  }

  // Guest → Public landing
  return (
    <>
      <SiteHeader />
      <PublicLandingView />
    </>
  );
}
