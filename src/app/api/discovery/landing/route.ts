import { NextResponse } from "next/server";
import type { SportDto, VenueResponseDto } from "@/lib/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";
const FIVE_MINUTES = 300;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

async function fetchBackend<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: FIVE_MINUTES, tags: ["landing-discovery"] },
  });
  if (!response.ok) throw new Error(`Backend ${path}: ${response.status}`);
  const body = await response.json() as ApiResponse<T>;
  if (!body.success || body.data == null) throw new Error(body.message || `Backend ${path} failed`);
  return body.data;
}

export async function GET() {
  try {
    const [sports, venues] = await Promise.all([
      fetchBackend<SportDto[]>("/Sports?IsActive=true"),
      fetchBackend<VenueResponseDto[]>("/Venues?PageIndex=1&PageSize=6"),
    ]);

    return NextResponse.json(
      { sports, venues },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json(
      { sports: [], venues: [], message: "Không thể tải dữ liệu khám phá" },
      { status: 503, headers: { "Cache-Control": "public, s-maxage=30" } },
    );
  }
}
