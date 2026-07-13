"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Chip, Alert, Skeleton, Pagination, Select, ListBox, Label, TextField, Input } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerBottomNav } from "@/components/layout/player-bottom-nav";
import { searchMatches } from "@/lib/api/matches";
import { getAllSports } from "@/lib/api/discovery";
import type { MatchResponseDto, SportDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatDate, formatTime } from "@/lib/utils/format";
import MapPin from "@gravity-ui/icons/MapPin";
import Person from "@gravity-ui/icons/Person";
import Calendar from "@gravity-ui/icons/Calendar";
import Plus from "@gravity-ui/icons/Plus";
import type { Key } from "@heroui/react";

export function MatchesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [matches, setMatches] = useState<MatchResponseDto[]>([]);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") ?? "";
  const sportId = searchParams.get("sportId") ? Number(searchParams.get("sportId")) : null;
  const pageIndex = Math.max(1, Number(searchParams.get("page")) || 1);

  useEffect(() => {
    getAllSports()
      .then(setSports)
      .catch(() => {});
  }, []);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchMatches({
        location: keyword || undefined,
        sportId: sportId ?? undefined,
        pageIndex,
        pageSize: 12,
      });
      setMatches(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách kèo đấu");
    } finally {
      setLoading(false);
    }
  }, [keyword, sportId, pageIndex]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const navigateWith = (params: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (params.keyword) p.set("keyword", params.keyword);
    if (params.sportId) p.set("sportId", params.sportId);
    if (params.page && params.page !== "1") p.set("page", params.page);
    router.push(`/matches${p.toString() ? `?${p}` : ""}`);
  };

  const handlePageChange = (page: number) => {
    navigateWith({
      keyword,
      sportId: sportId ? String(sportId) : null,
      page: String(page),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const LEVEL_MAP: Record<number, string> = {
    0: "Mới chơi",
    1: "Trung bình",
    2: "Nâng cao",
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Kèo đấu</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Tìm và tham gia các kèo đấu thể thao
            </p>
          </div>
          <Link href="/matches/create">
            <Button variant="primary" size="sm">
              <Plus className="size-4 mr-1" />
              Tạo kèo mới
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <TextField
            className="flex-1"
            value={keyword}
            onChange={(v) => navigateWith({ keyword: v || null, sportId: sportId ? String(sportId) : null, page: null })}
          >
            <Label>Tìm kiếm</Label>
            <Input placeholder="Tìm kiếm kèo đấu..." />
          </TextField>

          <Select
            className="w-full sm:w-48"
            placeholder="Môn thể thao"
            value={sportId}
            onChange={(k: Key | null) => navigateWith({ keyword, sportId: k ? String(k) : null, page: null })}
          >
            <Label>Môn thể thao</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="" textValue="Tất cả">Tất cả<ListBox.ItemIndicator /></ListBox.Item>
                {sports.map((s) => (
                  <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                    {s.name}<ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

        </div>

        {/* Error */}
        {error && (
          <Alert status="danger" className="mb-6">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
            <Button variant="danger" size="sm" onPress={fetchMatches}>
              Thử lại
            </Button>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Card.Content className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/5 rounded-lg" />
                  <Skeleton className="h-4 w-2/5 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                </Card.Content>
              </Card>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Person className="size-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--muted)] mb-4">Không tìm thấy kèo đấu nào.</p>
            <Link href="/matches/create">
              <Button variant="primary" size="sm">Tạo kèo mới</Button>
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && matches.length > 0 && (
          <>
            <p className="text-sm text-[var(--muted)] mb-4">
              Tìm thấy <span className="font-semibold text-[var(--foreground)]">{totalCount}</span> kèo đấu
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((m) => {
                const statusCfg = getStatusConfig("match", m.status);
                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <Card.Content className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[var(--foreground)] line-clamp-2">
                            {m.description || `${m.sportName} - ${m.venueName ?? "Chưa rõ địa điểm"}`}
                          </h3>
                          <Chip color={statusCfg.color} size="sm">{statusCfg.label}</Chip>
                        </div>
                        <div className="space-y-1.5 text-sm text-[var(--muted)]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5" />
                            <span>{formatDate(m.startAt)} · {formatTime(m.startAt)} - {formatTime(m.endAt)}</span>
                          </div>
                          {(m.venueName || m.locationDescription) && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3.5" />
                              <span className="truncate">{m.venueName ?? m.locationDescription}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Person className="size-3.5" />
                            <span>{m.participantCount}/{m.maxParticipants} người</span>
                            {m.availableSlots > 0 && (
                              <span className="text-[var(--success)]">· Còn {m.availableSlots} chỗ</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Chip size="sm" variant="soft">{m.sportName}</Chip>
                          {m.requiredSkillLevelMin && (
                            <Chip size="sm" variant="soft">
                              {m.requiredSkillLevelMin}
                            </Chip>
                          )}
                        </div>
                      </Card.Content>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex justify-center mt-8">
                <Pagination className="justify-center">
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={pageIndex <= 1}
                        onPress={() => handlePageChange(pageIndex - 1)}
                      >
                        <Pagination.PreviousIcon />
                      </Pagination.Previous>
                    </Pagination.Item>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageIndex) <= 1)
                      .map((p, _, arr) => {
                        const prev = arr[arr.indexOf(p) - 1];
                        const showEllipsis = prev != null && p - prev > 1;
                        return (
                          <span key={p} className="contents">
                            {showEllipsis && (
                              <Pagination.Item>
                                <Pagination.Ellipsis />
                              </Pagination.Item>
                            )}
                            <Pagination.Item>
                              <Pagination.Link
                                isActive={p === pageIndex}
                                onPress={() => handlePageChange(p)}
                              >
                                {p}
                              </Pagination.Link>
                            </Pagination.Item>
                          </span>
                        );
                      })}
                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={pageIndex >= totalPages}
                        onPress={() => handlePageChange(pageIndex + 1)}
                      >
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </nav>
            )}
          </>
        )}
      </main>
      <PlayerBottomNav />
    </div>
  );
}
