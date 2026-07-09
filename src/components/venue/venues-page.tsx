"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Alert, Pagination, Drawer } from "@heroui/react";
import Sliders from "@gravity-ui/icons/Sliders";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerBottomNav } from "@/components/layout/player-bottom-nav";
import { VenueCard } from "./venue-card";
import { VenueLoadingSkeleton } from "./venue-loading-skeleton";
import { VenueEmptyState } from "./venue-empty-state";
import { VenueFilterForm } from "./venue-filter-form";
import type { FilterValues } from "./venue-filter-form";
import { searchVenues, getAllSports } from "@/lib/api/discovery";
import type { VenueSearchParams } from "@/lib/api/discovery";
import type { DiscoveryVenue, VenueSearchResult } from "@/lib/types/discovery";

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */
function parseSearchParams(sp: URLSearchParams) {
  return {
    keyword: sp.get("Keyword") ?? "",
    sportId: sp.get("SportId") ? Number(sp.get("SportId")) : null,
    isOpenNow: sp.get("IsOpenNow") === "true",
    pageIndex: Math.max(1, Number(sp.get("PageIndex")) || 1),
    pageSize: 12,
  };
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

function buildSearchParams(filters: FilterValues, pageIndex: number): string {
  const p = new URLSearchParams();
  if (filters.keyword) p.set("Keyword", filters.keyword);
  if (filters.sportId != null) p.set("SportId", String(filters.sportId));
  if (filters.isOpenNow) p.set("IsOpenNow", "true");
  if (pageIndex > 1) p.set("PageIndex", String(pageIndex));
  p.set("PageSize", "12");
  return p.toString();
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */
export function VenuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL → filter state
  const parsed = parseSearchParams(searchParams);
  const filters: FilterValues = {
    keyword: parsed.keyword,
    sportId: parsed.sportId,
    isOpenNow: parsed.isOpenNow,
  };

  // Data state
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [result, setResult] = useState<VenueSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load sports once
  useEffect(() => {
    getAllSports()
      .then((data) =>
        setSports(data.map((s) => ({ id: s.id, name: s.name }))),
      )
      .catch(() => {
        /* sports load failed, filter will have empty list */
      });
  }, []);

  // Fetch venues when URL params change
  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: VenueSearchParams = {
        keyword: parsed.keyword || undefined,
        sportId: parsed.sportId ?? undefined,
        isOpenNow: parsed.isOpenNow || undefined,
        pageIndex: parsed.pageIndex,
        pageSize: parsed.pageSize,
      };
      const data = await searchVenues(params);
      setResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách sân",
      );
    } finally {
      setLoading(false);
    }
  }, [parsed.keyword, parsed.sportId, parsed.isOpenNow, parsed.pageIndex, parsed.pageSize]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Navigation helpers
  const navigateWithFilters = useCallback(
    (newFilters: FilterValues, pageIndex = 1) => {
      const qs = buildSearchParams(newFilters, pageIndex);
      router.push(`/venues${qs ? `?${qs}` : ""}`);
    },
    [router],
  );

  const handleApplyFilters = useCallback(
    (newFilters: FilterValues) => {
      navigateWithFilters(newFilters, 1);
      setDrawerOpen(false);
    },
    [navigateWithFilters],
  );

  const handleClearFilters = useCallback(() => {
    navigateWithFilters(
      { keyword: "", sportId: null, isOpenNow: false },
      1,
    );
    setDrawerOpen(false);
  }, [navigateWithFilters]);

  const handlePageChange = useCallback(
    (page: number) => {
      navigateWithFilters(filters, page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigateWithFilters, filters],
  );

  const handleRemoveFilter = useCallback(
    (key: keyof FilterValues) => {
      const next = { ...filters };
      if (key === "keyword") next.keyword = "";
      else if (key === "sportId") next.sportId = null;
      else if (key === "isOpenNow") next.isOpenNow = false;
      navigateWithFilters(next, 1);
    },
    [filters, navigateWithFilters],
  );

  // Active filter chips
  const activeChips: { key: string; label: string; onRemove: () => void }[] =
    [];
  if (filters.keyword) {
    activeChips.push({
      key: "keyword",
      label: `"${filters.keyword}"`,
      onRemove: () => handleRemoveFilter("keyword"),
    });
  }
  if (filters.sportId != null) {
    const sport = sports.find((s) => s.id === filters.sportId);
    activeChips.push({
      key: "sportId",
      label: sport?.name ?? `Sport #${filters.sportId}`,
      onRemove: () => handleRemoveFilter("sportId"),
    });
  }
  if (filters.isOpenNow) {
    activeChips.push({
      key: "isOpenNow",
      label: "Đang mở cửa",
      onRemove: () => handleRemoveFilter("isOpenNow"),
    });
  }

  const hasActiveFilters = activeChips.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Page Header */}
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Sân bãi
            </h1>
            <p className="mt-2 text-muted">
              Tìm và so sánh các sân thể thao phù hợp với lịch chơi của bạn
            </p>
          </div>
        </section>

        {/* Search Bar (inline, visible on all sizes) */}
        <section className="pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <VenueFilterForm
              sports={sports}
              values={filters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              showKeyword
              compact
            />
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-[260px] shrink-0">
                <div className="sticky top-24 rounded-xl border border-border bg-surface p-5">
                  <h2 className="font-semibold text-foreground mb-4">
                    Bộ lọc
                  </h2>
                  <VenueFilterForm
                    sports={sports}
                    values={filters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    showKeyword={false}
                  />
                </div>
              </aside>

              {/* Results Area */}
              <div className="flex-1 min-w-0">
                {/* Result Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    {result && (
                      <p className="text-sm text-muted">
                        Tìm thấy{" "}
                        <span className="font-semibold text-foreground">
                          {result.totalCount}
                        </span>{" "}
                        sân phù hợp
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mobile filter button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden"
                      onPress={() => setDrawerOpen(true)}
                    >
                      <Sliders className="w-4 h-4 mr-1" />
                      Bộ lọc
                      {hasActiveFilters && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                          {activeChips.length}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Active Chips */}
                {activeChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={chip.onRemove}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        aria-label={`Xóa bộ lọc ${chip.label}`}
                      >
                        {chip.label}
                        <span className="text-accent/60">×</span>
                      </button>
                    ))}
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <Alert status="danger" className="mb-6">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{error}</Alert.Title>
                    </Alert.Content>
                    <Button variant="danger" size="sm" onPress={fetchVenues}>
                      Thử lại
                    </Button>
                  </Alert>
                )}

                {/* Loading */}
                {loading && <VenueLoadingSkeleton />}

                {/* Empty */}
                {!loading && !error && result && result.items.length === 0 && (
                  <VenueEmptyState
                    activeFilters={activeChips.map((c) => c.label)}
                    onClearFilters={handleClearFilters}
                  />
                )}

                {/* Results Grid */}
                {!loading && !error && result && result.items.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {result.items.map((venue: DiscoveryVenue) => (
                        <VenueCard key={venue.id} venue={venue} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {result.totalPages > 1 && (
                      <nav className="flex justify-center mt-10" aria-label="Phân trang">
                        <Pagination className="justify-center">
                          <Pagination.Content>
                            <Pagination.Item>
                              <Pagination.Previous
                                isDisabled={parsed.pageIndex <= 1}
                                onPress={() => handlePageChange(parsed.pageIndex - 1)}
                              >
                                <Pagination.PreviousIcon />
                              </Pagination.Previous>
                            </Pagination.Item>
                            {getPageNumbers(parsed.pageIndex, result.totalPages).map((p, i) =>
                              p === "ellipsis" ? (
                                <Pagination.Item key={`e-${i}`}>
                                  <Pagination.Ellipsis />
                                </Pagination.Item>
                              ) : (
                                <Pagination.Item key={p}>
                                  <Pagination.Link
                                    isActive={p === parsed.pageIndex}
                                    onPress={() => handlePageChange(p as number)}
                                  >
                                    {p}
                                  </Pagination.Link>
                                </Pagination.Item>
                              ),
                            )}
                            <Pagination.Item>
                              <Pagination.Next
                                isDisabled={parsed.pageIndex >= result.totalPages}
                                onPress={() => handlePageChange(parsed.pageIndex + 1)}
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
              </div>
            </div>
          </div>
        </section>
      </main>
      <PlayerBottomNav />

      {/* Mobile/Tablet Filter Drawer */}
      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Backdrop />
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Bộ lọc</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <VenueFilterForm
                sports={sports}
                values={filters}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer>
    </>
  );
}
