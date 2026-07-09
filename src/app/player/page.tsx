"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /player → redirect to /
 * Landing page handles Player Discovery Home when logged in.
 */
export default function PlayerPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
