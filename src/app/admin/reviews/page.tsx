"use client";

import {
  Card,
  CardContent,
} from "@heroui/react";

import Star from "@gravity-ui/icons/Star";

import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <ReviewsContent />
      </AdminShell>
    </AdminGuard>
  );
}

function ReviewsContent() {
  // ponytail: Review moderation endpoint exists (moderateReview) but no listing endpoint
  // provided for admin. Add GET /admin/reviews?status=Reported when BE supports it.
  // For now show placeholder with info about the available API.

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kiểm duyệt đánh giá</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Quản lý đánh giá bị báo cáo
        </p>
      </div>

      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardContent className="p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <Star className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold">Đang chờ API</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Endpoint danh sách đánh giá cho admin chưa được hỗ trợ.
              <br />
              API kiểm duyệt đã sẵn sàng: <code className="text-xs bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded">moderateReview(id, status)</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
