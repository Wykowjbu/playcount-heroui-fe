"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Card,
  Chip,
  Input,
  Label,
  Link,
  ListBox,
  Select,
  Skeleton,
  TextField,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import ArrowRight from "@gravity-ui/icons/ArrowRight";
import Calendar from "@gravity-ui/icons/Calendar";
import Check from "@gravity-ui/icons/Check";
import Clock from "@gravity-ui/icons/Clock";
import MapPin from "@gravity-ui/icons/MapPin";
import Magnifier from "@gravity-ui/icons/Magnifier";
import Star from "@gravity-ui/icons/Star";
import type { SportDto, VenueResponseDto } from "@/lib/types/api";

interface LandingData {
  sports: SportDto[];
  venues: VenueResponseDto[];
}

const quickSearches = ["Cầu lông", "Pickleball", "Tennis", "Quận 7"];

export function PublicLandingView() {
  const [data, setData] = useState<LandingData>({ sports: [], venues: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sportId, setSportId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/landing")
      .then(async (response) => {
        if (!response.ok) throw new Error("Không thể tải dữ liệu khám phá");
        return response.json() as Promise<LandingData>;
      })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchHref = useMemo(() => {
    const query = new URLSearchParams();
    if (keyword.trim()) query.set("Keyword", keyword.trim());
    if (sportId) query.set("SportId", sportId);
    return `/venues${query.size ? `?${query}` : ""}`;
  }, [keyword, sportId]);

  const featuredVenue = data.venues[0];

  return (
    <main className="app-surface flex-1 overflow-hidden">
      <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="court-grid pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:pt-12">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft" className="border border-[var(--border)] bg-white text-[var(--accent)]">
                Sân trống cập nhật
              </Chip>
              <Chip size="sm" variant="soft" className="border border-[var(--border)] bg-white text-[var(--foreground)]">
                Đặt lịch nhanh
              </Chip>
            </div>

            <h1 className="hero-title font-display max-w-3xl text-4xl font-black leading-[1.02] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              Đặt sân nhanh.
              <span className="block text-[var(--accent)]">Vào trận đúng giờ.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              PlayCourt gom sân thể thao, lịch trống và kèo đấu vào một trải nghiệm tìm kiếm rõ ràng. Nhập khu vực, chọn môn chơi, rồi xem ngay sân phù hợp.
            </p>

            <div className="search-dock mt-6 max-w-4xl rounded-[1.5rem] p-2.5">
              <div className="grid gap-2.5 lg:grid-cols-[1.2fr_220px_auto]">
                <TextField aria-label="Khu vực hoặc tên sân">
                  <Label className="search-label">Khu vực hoặc tên sân</Label>
                  <div className="relative">
                    <span className="search-icon-badge">
                      <MapPin className="size-3.5" />
                    </span>
                    <Input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Nhập khu vực, tên sân"
                      className="search-control min-h-12 pl-11 text-[0.95rem]"
                    />
                  </div>
                </TextField>

                <Select
                  placeholder="Tất cả môn"
                  value={sportId}
                  onChange={(key) => setSportId(key ? String(key) : "")}
                >
                  <Label className="search-label">Môn chơi</Label>
                  <Select.Trigger className="search-control flex min-h-12 items-center gap-2 px-3 text-[0.95rem]">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[rgb(37_99_235_/_0.09)] text-[var(--accent)]">
                      <Star className="size-3.5" />
                    </span>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="search-popover">
                    <ListBox className="p-1">
                      <ListBox.Item id="" textValue="Tất cả" className="search-option">
                        Tất cả
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {data.sports.map((sport) => (
                        <ListBox.Item id={sport.id} key={sport.id} textValue={sport.name} className="search-option">
                          {sport.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Link
                  href={searchHref}
                  className={buttonVariants({
                    size: "lg",
                    className: "min-h-12 rounded-[0.875rem] bg-[var(--accent)] px-6 text-white shadow-md shadow-blue-900/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/20",
                  })}
                >
                  <Magnifier className="size-4" />
                  Tìm sân
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKeyword(item)}
                  className="min-h-11 cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="athletic-card relative overflow-hidden rounded-[24px] p-3">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[#38bdf8] to-[var(--warning)]" />
            <div className="relative aspect-[4/4.35] overflow-hidden rounded-[20px] bg-surface-secondary">
              {featuredVenue?.images?.[0]?.imageUrl ? (
                <img
                  src={featuredVenue.images[0].imageUrl}
                  alt={featuredVenue.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#dcfce7)]">
                  <span className="font-display text-7xl font-extrabold text-[var(--accent)]/20">PLAY</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-5 rounded-[18px] border border-white/45" />
              <div className="pointer-events-none absolute bottom-5 left-1/2 top-5 w-px bg-white/35" />
              <div className="pointer-events-none absolute left-5 right-5 top-1/2 h-px bg-white/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="mb-3 flex items-center justify-between">
                  <Chip size="sm" className="bg-[var(--warning)] text-black">Đang nổi bật</Chip>
                  <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {data.venues.length || 0} sân
                  </span>
                </div>
                <h2 className="font-display text-3xl font-bold uppercase leading-none text-white">
                  {featuredVenue?.name ?? "Sân thể thao gần bạn"}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-200">
                  {featuredVenue?.address ?? "Dữ liệu sân được đồng bộ trực tiếp từ PlayCourt."}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <ScoreTile label="Môn" value={data.sports.length || 3} />
              <ScoreTile label="Sân" value={data.venues.length || 0} />
              <ScoreTile label="Mở" value="24/7" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white/70 py-3">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="flex items-center gap-8 px-4">
              {["BADMINTON", "PICKLEBALL", "TENNIS", "BOOK FAST", "JOIN MATCHES", "PLAY TONIGHT"].map((item) => (
                <span key={`${group}-${item}`} className="font-display text-2xl font-bold uppercase text-[var(--foreground)]/70">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="courts" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Danh sách sân</p>
            <h2 className="font-display mt-2 text-4xl font-extrabold uppercase leading-none text-[var(--foreground)] md:text-5xl">
              Sân mới nhất
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Dữ liệu trực tiếp từ hệ thống. Card ưu tiên ảnh, địa chỉ, tiện ích và hành động đặt sân.
            </p>
          </div>
          <Link href="/venues" className={buttonVariants({ variant: "outline", className: "min-h-11 border-[var(--border)] text-[var(--foreground)]" })}>
            Xem tất cả <ArrowRight className="size-4" />
          </Link>
        </div>

        {error ? (
          <Card className="athletic-card rounded-3xl">
            <Card.Content className="p-8 text-center text-danger">{error}</Card.Content>
          </Card>
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-[28px]" />
            ))}
          </div>
        ) : data.venues.length === 0 ? (
          <Card className="athletic-card rounded-3xl">
            <Card.Content className="p-10 text-center text-[var(--muted)]">Chưa có cơ sở được duyệt.</Card.Content>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.venues.slice(0, 6).map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[28px] border border-[var(--border)] bg-white md:grid-cols-[1fr_360px]">
          <div className="p-8 md:p-10">
            <p className="font-display text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Cho chủ sân</p>
            <h2 className="font-display mt-3 text-4xl font-extrabold uppercase leading-none text-[var(--foreground)]">
              Ít tin nhắn hơn. Nhiều lịch đặt hơn.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Chủ sân có dashboard để quản lý cơ sở, lịch đặt, tiện ích, đánh giá và doanh thu. Người chơi đặt sân rõ ràng hơn, chủ sân bớt xử lý thủ công.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register/owner" className={buttonVariants({ size: "lg", className: "bg-[var(--warning)] text-black" })}>
                Đăng ký chủ sân <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "lg", className: "text-[var(--foreground)]" })}>
                Đăng nhập
              </Link>
            </div>
          </div>
          <div className="grid gap-2 border-t border-[var(--border)] bg-[var(--surface-secondary)] p-4 md:border-l md:border-t-0">
            <OwnerStat icon={<Calendar className="size-4" />} label="Lịch đặt" value="Theo thời gian thực" />
            <OwnerStat icon={<Clock className="size-4" />} label="Slot trống" value="Tối ưu giờ thấp điểm" />
            <OwnerStat icon={<Star className="size-4" />} label="Đánh giá" value="Tăng niềm tin người chơi" />
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="score-tile rounded-2xl p-3 text-center">
      <p className="font-display text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function OwnerStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--accent)]">
        {icon}
      </div>
      <p className="font-semibold text-[var(--foreground)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{value}</p>
    </div>
  );
}

function VenueCard({ venue }: { venue: VenueResponseDto }) {
  const cover = venue.images?.find((image) => image.isCover) ?? venue.images?.[0];
  return (
    <Card className="interactive-card group overflow-hidden rounded-[24px]">
      <Card.Content className="p-0">
        <div className="relative h-52 bg-surface-secondary">
          {cover ? (
            <img src={cover.imageUrl} alt={venue.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#dcfce7)]">
              <span className="font-display text-6xl font-extrabold text-[var(--accent)]/20">{venue.name.charAt(0)}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/40" />
          <div className="pointer-events-none absolute bottom-4 left-1/2 top-4 w-px bg-white/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
          <Chip size="sm" className="absolute left-4 top-4 bg-[var(--success)] text-white">
            Đã duyệt
          </Chip>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="line-clamp-1 font-display text-2xl font-bold uppercase leading-none text-white">{venue.name}</h3>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-200">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span className="line-clamp-2">{venue.address}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {venue.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {venue.amenities.slice(0, 3).map((amenity) => (
                <Chip key={amenity.id} size="sm" variant="soft" className="bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  <Check className="size-3" />
                  {amenity.name}
                </Chip>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/venues/${venue.id}`} className={buttonVariants({ variant: "outline", className: "min-h-11 border-[var(--border)] text-[var(--foreground)]" })}>
              Xem sân
            </Link>
            <Link href={`/venues/${venue.id}?book=1`} className={buttonVariants({ className: "min-h-11 bg-[var(--accent)] text-white" })}>
              Đặt sân
            </Link>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
