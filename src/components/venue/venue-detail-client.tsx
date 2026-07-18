"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Breadcrumbs,
  Card,
  Chip,
  DatePicker,
  DateField,
  Calendar,
  Drawer,
  Label,
  Link,
  ListBox,
  Select,
  Separator,
  Skeleton,
  Tabs,
  TimeField,
} from "@heroui/react";
import { type DateValue, Time } from "@internationalized/date";
import { SiteHeader } from "@/components/layout/site-header";
import type { Key } from "@heroui/react";
import {
  MapPin,
  Star,
  StarFill,
  Smartphone,
  Clock,
  ChevronLeft,
  CircleCheck,
  CircleCheckFill,
  Person,
  Calendar as CalendarIcon,
} from "@gravity-ui/icons";
import type {
  VenueResponseDto,
  CourtDto,
  OpeningHourDto,
  ReviewResponseDto,
  RatingStatsDto,
} from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";

// ─── Props ───
interface Props {
  venueId: number;
  venue: VenueResponseDto;
  courts: CourtDto[];
  openingHours: OpeningHourDto[];
  ratings: RatingStatsDto;
  reviews: ReviewResponseDto[];
}

// ─── Format helpers ───
function formatPrice(n?: number | null) {
  return (n ?? 0).toLocaleString("vi-VN") + "đ";
}

function parseTime(timeStr: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return new Time(h, m);
}

/** TimeField client-only wrapper — avoids hydration mismatch from locale-dependent segments */
function ClientTimeField(props: React.ComponentProps<typeof TimeField>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-full h-16" />;
  return <TimeField {...props} />;
}

const DAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function formatOpeningHours(openingHours: OpeningHourDto[]): string[] {
  if (!openingHours.length) return [];

  // Group consecutive days with same schedule
  const sorted = [...openingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const groups: { days: number[]; open: string; close: string }[] = [];

  for (const h of sorted) {
    if (h.isClosed) {
      groups.push({ days: [h.dayOfWeek], open: "", close: "" });
      continue;
    }
    const last = groups[groups.length - 1];
    if (
      last &&
      !last.open === !h.openTime &&
      last.open === (h.openTime ?? "") &&
      last.close === (h.closeTime ?? "")
    ) {
      last.days.push(h.dayOfWeek);
    } else {
      groups.push({
        days: [h.dayOfWeek],
        open: h.openTime ?? "",
        close: h.closeTime ?? "",
      });
    }
  }

  return groups.map((g) => {
    const dayLabel =
      g.days.length === 1
        ? DAY_NAMES[g.days[0]]
        : g.days.length > 1
          ? `${DAY_NAMES[g.days[0]]} - ${DAY_NAMES[g.days[g.days.length - 1]]}`
          : "";
    if (!g.open) return `${dayLabel}: Nghỉ`;
    return `${dayLabel}: ${g.open} - ${g.close}`;
  });
}

function isVenueOpenToday(openingHours: OpeningHourDto[]): boolean {
  const today = new Date().getDay();
  const todayHours = openingHours.find((h) => h.dayOfWeek === today);
  return !!todayHours && !todayHours.isClosed;
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

export function VenueDetailClient({ venueId, venue, courts, openingHours, ratings, reviews }: Props) {
  const router = useRouter();
  const [selectedCourtId, setSelectedCourtId] = useState<Key | null>(null);
  const [selectedSportId, setSelectedSportId] = useState<Key | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<Key | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);
  const availableCourts = courts.filter((c) => c.status === "Available" || c.status === "available");
  const availableSports = Array.from(new Map(availableCourts.map((court) => [court.sportId, court.sportName])).entries());
  const filteredCourts = selectedSportId
    ? availableCourts.filter((court) => court.sportId === Number(selectedSportId))
    : [];

  const isFormComplete = selectedSportId && selectedCourtId && selectedDate && selectedTime && selectedDuration;

  const handleBook = () => {
    router.push(
      `/bookings/checkout?venue=${venueId}&court=${selectedCourtId}&date=${selectedDate}&time=${selectedTime}&duration=${selectedDuration}`,
    );
  };

  const venueImages = (venue.images ?? []).map((i) => i.imageUrl);
  const venueAmenities = (venue.amenities ?? []).map((a) => a.name);
  const formattedHours = formatOpeningHours(openingHours);
  const isOpen = isVenueOpenToday(openingHours);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      {/* ─── BREADCRUMB ─── */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2 sm:px-6 lg:px-8">
        <div className="hidden lg:block">
          <Breadcrumbs>
            <Breadcrumbs.Item href="/">Trang chủ</Breadcrumbs.Item>
            <Breadcrumbs.Item href="/venues">Danh sách sân</Breadcrumbs.Item>
            <Breadcrumbs.Item>{venue.name}</Breadcrumbs.Item>
          </Breadcrumbs>
        </div>
        <div className="lg:hidden">
          <Link className="inline-flex items-center gap-1 text-sm" href="/">
            <ChevronLeft className="size-4" />
            Quay lại
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-12">
        {/* ─── HERO GALLERY ─── */}
        <HeroGallery images={venueImages} name={venue.name} />

        {/* ─── GRID ─── */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Chip color={isOpen ? "success" : "default"}>
                {isOpen ? <CircleCheckFill className="mr-1 inline size-3.5" /> : <Clock className="mr-1 inline size-3.5" />}
                {isOpen ? "Đang mở cửa hôm nay" : "Đã đóng cửa hôm nay"}
              </Chip>
              {isOpen && (
                <Chip color="accent" variant="soft">
                  <CircleCheckFill className="mr-1 inline size-3.5" />
                  Có thể đặt trực tuyến
                </Chip>
              )}
            </div>

            <h1 className="text-2xl font-bold lg:text-3xl">{venue.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4 shrink-0" />{venue.address}
              </span>
              {ratings.totalReviews > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <StarFill className="size-4 text-[var(--warning)]" />
                  {(ratings.averageRating ?? 0).toFixed(1)}/5.0
                  <span className="text-xs">({ratings.totalReviews} đánh giá)</span>
                </span>
              ) : <span>Chưa có đánh giá</span>}
              {venue.phone && (
                <a className="inline-flex items-center gap-1 hover:text-[var(--foreground)]" href={`tel:${venue.phone}`}>
                  <Smartphone className="size-4" />{venue.phone}
                </a>
              )}
            </div>

            {venueAmenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {venueAmenities.slice(0, 4).map((name) => (
                  <Chip key={name} variant="soft">
                    <CircleCheck className="mr-1 inline size-3.5" />{name}
                  </Chip>
                ))}
                {venueAmenities.length > 4 && (
                  <Chip variant="soft">+{venueAmenities.length - 4} tiện ích nữa</Chip>
                )}
              </div>
            )}

            <Separator />

            {/* ─── TABS ─── */}
            <Tabs className="w-full" defaultSelectedKey="courts">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Chi tiết sân">
                  <Tabs.Tab id="courts">Sân & Lịch trống<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="reviews">Đánh giá<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="info">Giờ mở & Giới thiệu<Tabs.Indicator /></Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel className="pt-6" id="courts">
                <CourtsTab
                  courts={courts}
                  selectedCourtId={selectedCourtId}
                  onSelectCourt={setSelectedCourtId}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
              </Tabs.Panel>

              <Tabs.Panel className="pt-6" id="reviews">
                <ReviewsTab ratings={ratings} reviews={reviews} />
              </Tabs.Panel>

              <Tabs.Panel className="pt-6" id="info">
                <InfoTab
                  openingHours={formattedHours}
                  description={venue.description}
                />
              </Tabs.Panel>
            </Tabs>
          </div>

          {/* RIGHT — Booking Widget (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BookingWidget
                courts={filteredCourts}
                sports={availableSports}
                selectedSportId={selectedSportId}
                onSportChange={(key) => { setSelectedSportId(key); setSelectedCourtId(null); }}
                selectedCourtId={selectedCourtId}
                onCourtChange={setSelectedCourtId}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
                selectedDuration={selectedDuration}
                onDurationChange={setSelectedDuration}
                isFormComplete={!!isFormComplete}
                onBook={handleBook}
                phone={venue.phone}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE STICKY BAR ─── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] p-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Giá từ</p>
            <p className="text-lg font-bold text-[var(--accent)]">
              Theo khung giờ
            </p>
          </div>
          <Button onPress={() => setDrawerOpen(true)}>ĐẶT SÂN</Button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER ─── */}
      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Backdrop>
          <Drawer.Content placement="bottom">
            <Drawer.Dialog>
              <Drawer.Handle />
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Đặt sân</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body className="px-4 pb-6">
                <BookingWidget
                  courts={filteredCourts}
                  sports={availableSports}
                  selectedSportId={selectedSportId}
                  onSportChange={(key) => { setSelectedSportId(key); setSelectedCourtId(null); }}
                  selectedCourtId={selectedCourtId}
                  onCourtChange={setSelectedCourtId}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                  isFormComplete={!!isFormComplete}
                  onBook={() => { handleBook(); setDrawerOpen(false); }}
                  phone={venue.phone}
                />
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
}

// ═══════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════

// ─── Hero Gallery ───
function HeroGallery({ images, name }: { images: string[]; name: string }) {
  if (!images.length) {
    return (
      <div className="h-64 rounded-2xl bg-[var(--surface-secondary)] lg:h-96">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-[2fr_1fr] lg:grid-rows-2">
      <div className="lg:row-span-2">
        <img alt={name} className="h-72 w-full rounded-2xl object-cover lg:h-[22.5rem]" src={images[0]} />
      </div>
      {images.slice(1, 3).map((img, i) => (
        <div key={i} className="hidden lg:block">
          <img alt={`${name} ${i + 2}`} className="h-full w-full rounded-xl object-cover" src={img} />
        </div>
      ))}
    </div>
  );
}

// ─── Courts Tab ───
function CourtsTab({
  courts, selectedCourtId, onSelectCourt, selectedTime, onSelectTime,
}: {
  courts: CourtDto[];
  selectedCourtId: Key | null;
  onSelectCourt: (id: Key | null) => void;
  selectedTime: string;
  onSelectTime: (t: string) => void;
}) {
  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {courts.map((court) => {
          const isSelected = court.id === selectedCourtId;
          const isDisabled = court.status === "Maintenance" || court.status === "maintenance";
          return (
            <Button
              key={court.id}
              className={`h-auto justify-start rounded-xl border-2 p-4 text-left ${
                isSelected ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
              isDisabled={isDisabled}
              onPress={() => onSelectCourt(court.id)}
              variant="ghost"
            >
              <div className="flex w-full items-start justify-between">
                <div>
                  <p className="font-semibold">{court.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {court.sportName} · {court.indoor ? "Trong nhà" : "Ngoài trời"}
                  </p>
                </div>
                <Chip color={isDisabled ? "warning" : "success"} size="sm">
                  {isDisabled ? "Bảo trì" : "Trống"}
                </Chip>
              </div>
            </Button>
          );
        })}
      </div>

      {selectedCourt && (
        <div className="space-y-3">
          <Separator />
          <p className="text-sm font-medium">
            Khung giờ trống — {selectedCourt.name}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Vui lòng chọn ngày ở widget bên phải để xem lịch trống
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ───
function ReviewsTab({ ratings, reviews }: { ratings: RatingStatsDto; reviews: ReviewResponseDto[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-1">
          <p className="text-4xl font-bold">{(ratings.averageRating ?? 0).toFixed(1)}</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarFill key={s} className={`size-4 ${s <= Math.round(ratings.averageRating ?? 0) ? "text-[var(--warning)]" : "text-[var(--muted)]"}`} />
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">{ratings.totalReviews} đánh giá</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratings.ratingDistribution?.[star] ?? 0;
            const pct = ratings.totalReviews > 0 ? (count / ratings.totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right">{star} sao</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                  <div className="h-full rounded-full bg-[var(--warning)]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-[var(--muted)]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Chưa có đánh giá nào.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
              <Person className="size-5 text-[var(--muted)]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{r.playerName}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) =>
                    s <= r.rating ? (
                      <StarFill key={s} className="size-3 text-[var(--warning)]" />
                    ) : (
                      <Star key={s} className="size-3 text-[var(--muted)]" />
                    ),
                  )}
                </div>
                <span className="text-xs text-[var(--muted)]">{formatDate(r.createdAt)}</span>
              </div>
              {r.reviewText && <p className="text-sm text-[var(--muted)]">{r.reviewText}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Info Tab ───
function InfoTab({ openingHours, description }: { openingHours: string[]; description: string | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Clock className="size-5" />Giờ mở cửa
        </h3>
        {openingHours.length > 0 ? (
          <ul className="space-y-2">
            {openingHours.map((h, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CircleCheck className="size-4 text-[var(--success)]" />{h}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">Chưa cập nhật giờ mở cửa.</p>
        )}
      </div>
      <Separator />
      {description && (
        <div>
          <h3 className="mb-3 font-semibold">Giới thiệu</h3>
          <p className="text-sm leading-relaxed text-[var(--muted)]">{description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Booking Widget ───
function BookingWidget({
  courts, sports, selectedSportId, onSportChange, selectedCourtId, onCourtChange,
  selectedDate, onDateChange,
  selectedTime, onTimeChange,
  selectedDuration, onDurationChange,
  isFormComplete, onBook, phone,
}: {
  courts: CourtDto[];
  sports: [number, string][];
  selectedSportId: Key | null;
  onSportChange: (key: Key | null) => void;
  selectedCourtId: Key | null;
  onCourtChange: (k: Key | null) => void;
  selectedDate: DateValue | null;
  onDateChange: (d: DateValue | null) => void;
  selectedTime: string;
  onTimeChange: (t: string) => void;
  selectedDuration: Key | null;
  onDurationChange: (k: Key | null) => void;
  isFormComplete: boolean;
  onBook: () => void;
  phone: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <Card.Content className="space-y-4 p-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Content className="space-y-4 p-5">
        <h3 className="text-lg font-bold">Chọn lịch đặt sân</h3>

        <Select className="w-full" placeholder="Chọn môn thể thao" value={selectedSportId} onChange={onSportChange}>
          <Label>Môn thể thao</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover><ListBox>{sports.map(([id, name]) => <ListBox.Item id={id} key={id} textValue={name}>{name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>

        <Select
          className="w-full"
          placeholder={selectedSportId ? "Chọn sân con" : "Chọn môn trước"}
          value={selectedCourtId}
          onChange={onCourtChange}
          isDisabled={!selectedSportId}
        >
          <Label>Sân</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover><ListBox>{courts.map((c) => <ListBox.Item key={c.id} id={c.id} textValue={c.name}>{c.name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>

        <DatePicker className="w-full" value={selectedDate} onChange={onDateChange} isDisabled={!selectedCourtId}>
          <Label>Chọn ngày chơi</Label>
          <DateField.Group>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <CalendarIcon className="size-4" />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover>
            <Calendar aria-label="Chọn ngày">
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>

        <ClientTimeField
          className="w-full"
          value={parseTime(selectedTime)}
          onChange={(v) => {
            if (v) onTimeChange(`${String(v.hour).padStart(2, "0")}:${String(v.minute).padStart(2, "0")}`);
          }}
        >
          <Label>Giờ bắt đầu</Label>
          <TimeField.Group>
            <TimeField.Input>
              {(segment) => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>
        </ClientTimeField>

        <Select
          className="w-full"
          placeholder="Chọn thời lượng"
          value={selectedDuration}
          onChange={onDurationChange}
        >
          <Label>Thời lượng</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="60" textValue="60 phút">60 phút<ListBox.ItemIndicator /></ListBox.Item>
              <ListBox.Item id="90" textValue="90 phút">90 phút<ListBox.ItemIndicator /></ListBox.Item>
              <ListBox.Item id="120" textValue="120 phút">120 phút<ListBox.ItemIndicator /></ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>

        <Button className="w-full" size="lg" isDisabled={!isFormComplete} onPress={onBook}>
          TIẾP TỤC ĐẶT SÂN
        </Button>
        {!isFormComplete && <p className="text-sm text-[var(--muted)]">Chọn môn, sân, ngày, giờ và thời lượng để tiếp tục.</p>}

        <div className="flex gap-2">
          {phone && (
            <Link
              className="flex-1 rounded-lg bg-[var(--surface-secondary)] px-3 py-1.5 text-center text-sm font-medium hover:bg-[var(--foreground)]/10"
              href={`tel:${phone}`}
            >
              Liên hệ chủ sân
            </Link>
          )}
          <Button className="flex-1" variant="secondary" size="sm">
            Tạo kèo tại sân này
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
