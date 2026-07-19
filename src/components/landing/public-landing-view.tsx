"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Chip, Input, Label, Link, ListBox, Select, Skeleton, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import ArrowRight from "@gravity-ui/icons/ArrowRight";
import MapPin from "@gravity-ui/icons/MapPin";
import Magnifier from "@gravity-ui/icons/Magnifier";
import type { SportDto, VenueResponseDto } from "@/lib/types/api";

interface LandingData {
  sports: SportDto[];
  venues: VenueResponseDto[];
}

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
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải dữ liệu"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const searchHref = useMemo(() => {
    const query = new URLSearchParams();
    if (keyword.trim()) query.set("keyword", keyword.trim());
    if (sportId) query.set("sportId", sportId);
    return `/venues${query.size ? `?${query}` : ""}`;
  }, [keyword, sportId]);

  return <main className="flex-1">
    <section className="relative overflow-hidden bg-gradient-to-br from-accent via-accent/90 to-indigo-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">Tìm sân phù hợp, đặt lịch rõ ràng</h1><p className="mx-auto mt-4 max-w-xl text-white/80">Chọn môn thể thao và khu vực. PlayCourt hiển thị đúng cơ sở đang có trên hệ thống.</p></div>
        <Card className="mx-auto mt-10 max-w-4xl bg-white text-foreground shadow-xl"><Card.Content className="grid gap-3 p-4 md:grid-cols-[1fr_240px_auto] md:p-6">
          <TextField aria-label="Tên sân hoặc địa chỉ"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên sân hoặc địa chỉ" /></TextField>
          <Select placeholder="Tất cả môn thể thao" value={sportId} onChange={(key) => setSportId(key ? String(key) : "")}><Label className="sr-only">Môn thể thao</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox><ListBox.Item id="" textValue="Tất cả">Tất cả<ListBox.ItemIndicator /></ListBox.Item>{data.sports.map((sport) => <ListBox.Item id={sport.id} key={sport.id} textValue={sport.name}>{sport.name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
          <Link href={searchHref} className={buttonVariants({ size: "lg", className: "w-full" })}><Magnifier className="size-4" />Tìm sân</Link>
        </Card.Content></Card>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between"><div><h2 className="text-2xl font-bold">Cơ sở mới nhất</h2><p className="text-sm text-muted">Dữ liệu trực tiếp từ PlayCourt</p></div><Link href="/venues" className={buttonVariants({ variant: "ghost" })}>Xem tất cả <ArrowRight className="size-4" /></Link></div>
      {error ? <Card><Card.Content className="p-8 text-center text-danger">{error}</Card.Content></Card> : loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)}</div> : data.venues.length === 0 ? <Card><Card.Content className="p-10 text-center text-muted">Chưa có cơ sở được duyệt.</Card.Content></Card> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}</div>}
    </section>

    <section className="bg-surface-secondary"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8"><div><h2 className="text-2xl font-bold">Bạn đang vận hành sân thể thao?</h2><p className="mt-2 text-muted">Đăng ký tài khoản chủ sân để tạo cơ sở và quản lý lịch đặt.</p></div><Link href="/register/owner" className={buttonVariants({ size: "lg" })}>Đăng ký chủ sân <ArrowRight className="size-4" /></Link></div></section>
  </main>;
}

function VenueCard({ venue }: { venue: VenueResponseDto }) {
  const cover = venue.images?.find((image) => image.isCover) ?? venue.images?.[0];
  return <Card className="overflow-hidden"><Card.Content className="p-0">
    <div className="h-40 bg-accent/10">{cover ? <img src={cover.imageUrl} alt={venue.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-accent/40">{venue.name.charAt(0)}</div>}</div>
    <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{venue.name}</h3><p className="mt-1 flex items-start gap-1 text-sm text-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{venue.address}</p></div><Chip size="sm" color="success">Đã duyệt</Chip></div>
      {venue.amenities?.length > 0 && <div className="flex flex-wrap gap-1">{venue.amenities.slice(0, 3).map((amenity) => <Chip key={amenity.id} size="sm" variant="soft">{amenity.name}</Chip>)}</div>}
      <Link href={`/venues/${venue.id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>Xem sân</Link>
    </div>
  </Card.Content></Card>;
}
