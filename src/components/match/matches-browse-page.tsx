"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Chip, Alert, Skeleton, Pagination, Select, ListBox, Label, TextField, Input, Modal, Checkbox, FieldError } from "@heroui/react";
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
import { CreateMatchPage } from "./create-match-page";
import { toLocalIsoAtWallTime } from "@/lib/utils/player-flow";

export function MatchesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [matches, setMatches] = useState<MatchResponseDto[]>([]);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const mountedRef = useRef(false);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestGenerationRef.current += 1;
    };
  }, []);

  const location = searchParams.get("location") ?? "";
  const sportId = searchParams.get("sportId") ? Number(searchParams.get("sportId")) : null;
  const skillLevel = searchParams.get("skillLevel") ? Number(searchParams.get("skillLevel")) : null;
  const startFrom = searchParams.get("startFrom") ?? "";
  const startTo = searchParams.get("startTo") ?? "";
  const includeFull = searchParams.get("includeFull") === "true";
  const pageIndex = Math.max(1, Number(searchParams.get("page")) || 1);
  const [draftLocation, setDraftLocation] = useState(location);
  const [draftSportId, setDraftSportId] = useState<Key | null>(sportId);
  const [draftSkillLevel, setDraftSkillLevel] = useState<Key | null>(skillLevel);
  const [draftStartFrom, setDraftStartFrom] = useState(startFrom);
  const [draftStartTo, setDraftStartTo] = useState(startTo);
  const [draftIncludeFull, setDraftIncludeFull] = useState(includeFull);
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    setDraftLocation(location);
    setDraftSportId(sportId);
    setDraftSkillLevel(skillLevel);
    setDraftStartFrom(startFrom);
    setDraftStartTo(startTo);
    setDraftIncludeFull(includeFull);
    setFilterError("");
  }, [includeFull, location, skillLevel, sportId, startFrom, startTo]);

  useEffect(() => {
    getAllSports()
      .then(setSports)
      .catch(() => {});
  }, []);

  const fetchMatches = useCallback(async () => {
    const generation = ++requestGenerationRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await searchMatches({
        location: location || undefined,
        sportId: sportId ?? undefined,
        skillLevel: skillLevel ?? undefined,
        startFrom: startFrom ? toLocalIsoAtWallTime(startFrom, "00:00") : undefined,
        startTo: startTo ? toLocalIsoAtWallTime(startTo, "23:59") : undefined,
        includeFull: includeFull || undefined,
        pageIndex,
        pageSize: 12,
      });
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setMatches(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      if (mountedRef.current && generation === requestGenerationRef.current) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách kèo đấu");
      }
    } finally {
      if (mountedRef.current && generation === requestGenerationRef.current) setLoading(false);
    }
  }, [includeFull, location, pageIndex, skillLevel, sportId, startFrom, startTo]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const navigateWith = (params: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (params.location) p.set("location", params.location);
    if (params.sportId) p.set("sportId", params.sportId);
    if (params.skillLevel) p.set("skillLevel", params.skillLevel);
    if (params.startFrom) p.set("startFrom", params.startFrom);
    if (params.startTo) p.set("startTo", params.startTo);
    if (params.includeFull) p.set("includeFull", params.includeFull);
    if (params.page && params.page !== "1") p.set("page", params.page);
    router.push(`/matches${p.toString() ? `?${p}` : ""}`);
  };

  const handlePageChange = (page: number) => {
    navigateWith({
      location,
      sportId: sportId ? String(sportId) : null,
      skillLevel: skillLevel != null ? String(skillLevel) : null,
      startFrom: startFrom || null,
      startTo: startTo || null,
      includeFull: includeFull ? "true" : null,
      page: String(page),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyFilters = () => {
    if (draftStartFrom && draftStartTo && draftStartFrom > draftStartTo) {
      setFilterError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu");
      return;
    }
    try {
      if (draftStartFrom) toLocalIsoAtWallTime(draftStartFrom, "00:00");
      if (draftStartTo) toLocalIsoAtWallTime(draftStartTo, "23:59");
    } catch {
      setFilterError("Khoảng ngày không tồn tại trong múi giờ hiện tại");
      return;
    }
    setFilterError("");
    navigateWith({
      location: draftLocation.trim() || null,
      sportId: draftSportId != null ? String(draftSportId) : null,
      skillLevel: draftSkillLevel != null ? String(draftSkillLevel) : null,
      startFrom: draftStartFrom || null,
      startTo: draftStartTo || null,
      includeFull: draftIncludeFull ? "true" : null,
      page: null,
    });
  };

  const resetFilters = () => {
    setDraftLocation("");
    setDraftSportId(null);
    setDraftSkillLevel(null);
    setDraftStartFrom("");
    setDraftStartTo("");
    setDraftIncludeFull(false);
    setFilterError("");
    router.push("/matches");
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
          <Button variant="primary" size="sm" onPress={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" />
            Tạo kèo mới
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            className="sm:col-span-2"
            value={draftLocation}
            onChange={setDraftLocation}
          >
            <Label>Địa điểm</Label>
            <Input placeholder="Quận, thành phố hoặc tên sân" />
          </TextField>

          <Select
            className="w-full sm:w-48"
            placeholder="Môn thể thao"
            value={draftSportId}
            onChange={setDraftSportId}
          >
            <Label>Môn thể thao</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {sports.map((s) => (
                  <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                    {s.name}<ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <Select className="w-full" placeholder="Mọi trình độ" value={draftSkillLevel} onChange={setDraftSkillLevel}>
            <Label>Trình độ</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>
              <ListBox.Item id={0} textValue="Mới chơi">Mới chơi<ListBox.ItemIndicator /></ListBox.Item>
              <ListBox.Item id={1} textValue="Trung bình">Trung bình<ListBox.ItemIndicator /></ListBox.Item>
              <ListBox.Item id={2} textValue="Nâng cao">Nâng cao<ListBox.ItemIndicator /></ListBox.Item>
            </ListBox></Select.Popover>
          </Select>
          <TextField value={draftStartFrom} onChange={setDraftStartFrom} isInvalid={!!filterError}><Label>Từ ngày</Label><Input type="date" /></TextField>
          <TextField value={draftStartTo} onChange={setDraftStartTo} isInvalid={!!filterError}><Label>Đến ngày</Label><Input type="date" />{filterError && <FieldError>{filterError}</FieldError>}</TextField>
          <Checkbox isSelected={draftIncludeFull} onChange={setDraftIncludeFull} className="min-h-11 self-end">
            <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Bao gồm kèo đã đủ người</Checkbox.Content>
          </Checkbox>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button className="min-h-11 flex-1" variant="primary" onPress={applyFilters}>Áp dụng bộ lọc</Button>
            <Button className="min-h-11" variant="outline" onPress={resetFilters}>Đặt lại bộ lọc</Button>
          </div>
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
            <Button variant="primary" size="sm" onPress={() => setCreateOpen(true)}>Tạo kèo mới</Button>
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
      <Modal>
        <Modal.Backdrop isOpen={createOpen} onOpenChange={(open) => { if (open || !createSubmitting) setCreateOpen(open); }} variant="blur">
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog aria-label="Tạo kèo mới">
              {!createSubmitting && <Modal.CloseTrigger />}
              <Modal.Header>
                <div>
                  <Modal.Heading>Tạo kèo mới</Modal.Heading>
                  <p className="mt-1 text-sm text-[var(--muted)]">Nhập thông tin để tìm người chơi phù hợp.</p>
                </div>
              </Modal.Header>
              <Modal.Body className="px-6 py-0">
                <CreateMatchPage embedded onSubmittingChange={setCreateSubmitting} />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" isDisabled={createSubmitting} onPress={() => { if (!createSubmitting) setCreateOpen(false); }}>Hủy</Button>
                <Button form="create-match-form" type="submit" isDisabled={createSubmitting} isPending={createSubmitting}>
                  {createSubmitting ? "Đang tạo..." : "Tạo kèo đấu"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <PlayerBottomNav />
    </div>
  );
}
