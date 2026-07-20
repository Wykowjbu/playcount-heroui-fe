"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Alert,
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
} from "@heroui/react";
import { getLocalTimeZone, parseDate, today, type DateValue } from "@internationalized/date";
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
  VenueAvailabilityResponseDto,
} from "@/lib/types/api";
import { formatDate, formatVnd } from "@/lib/utils/format";
import { getVenueAvailability } from "@/lib/api/discovery";
import { getBookableDurations, getScheduleSlotIndexes } from "@/lib/utils/player-flow";
import { orderReviewImages } from "@/lib/utils/review-images";

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
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<Key | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [availability, setAvailability] = useState<VenueAvailabilityResponseDto | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const availableCourts = courts.filter((c) => c.status === "Available" || c.status === "available");
  const availableSports = Array.from(new Map(availableCourts.map((court) => [court.sportId, court.sportName])).entries());
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courtId = Number(params.get("court"));
    const date = params.get("date");
    const court = courts.find(({ id }) => id === courtId);
    if (court) {
      setSelectedSportId(court.sportId);
      setSelectedCourtId(court.id);
    }
    if (date) {
      try { setSelectedDate(parseDate(date)); } catch { /* Ignore malformed recovery context. */ }
    }
  }, [courts]);

  useEffect(() => {
    setSelectedStartAt("");
    setSelectedDuration(null);
    setAvailability(null);
    setAvailabilityError(null);
    setAvailabilityLoading(false);
    if (!selectedSportId || !selectedDate) return;

    let current = true;
    setAvailabilityLoading(true);
    getVenueAvailability(venueId, selectedDate.toString())
      .then((result) => { if (current) setAvailability(result); })
      .catch((error: unknown) => { if (current) setAvailabilityError(error instanceof Error ? error.message : "Không thể tải lịch trống."); })
      .finally(() => { if (current) setAvailabilityLoading(false); });
    return () => { current = false; };
  }, [venueId, selectedSportId, selectedDate, retryKey]);

  const selectedBookingCourt = availability?.courts.find(({ id }) => id === Number(selectedCourtId));
  const selectedStartIndex = selectedBookingCourt?.slots.findIndex(({ startAt }) => startAt === selectedStartAt) ?? -1;
  const selectedEndAt = selectedStartIndex >= 0 && selectedDuration
    ? selectedBookingCourt?.slots[selectedStartIndex + Number(selectedDuration) / 30 - 1]?.endAt
    : undefined;
  const isFormComplete = selectedSportId && selectedCourtId && selectedDate && selectedStartAt && selectedDuration && selectedEndAt;

  const handleBook = () => {
    if (!selectedCourtId || !selectedDate || !selectedStartAt || !selectedDuration || !selectedEndAt) return;
    const params = new URLSearchParams({
      venue: String(venueId),
      court: String(selectedCourtId),
      date: selectedDate.toString(),
      time: selectedStartAt.slice(11, 16),
      duration: String(selectedDuration),
      startAt: selectedStartAt,
      endAt: selectedEndAt,
    });
    router.push(`/bookings/checkout?${params}`);
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
          <Link className="inline-flex min-h-11 items-center gap-1 text-sm" href="/venues">
            <ChevronLeft className="size-4" />
            Quay lại
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 lg:pb-12">
        {/* ─── HERO GALLERY ─── */}
        <HeroGallery images={venueImages} name={venue.name} />

        {/* ─── GRID ─── */}
        <div className="mt-8 grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT */}
          <div className="min-w-0 space-y-6">
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
              <a
                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-medium text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.latitude != null && venue.longitude != null ? `${venue.latitude},${venue.longitude}` : venue.address)}`}
                rel="noreferrer"
                target="_blank"
              >
                <MapPin className="size-4" />Mở chỉ đường
              </a>
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
                  sports={availableSports}
                  selectedSportId={selectedSportId}
                  onSportChange={(key) => { setSelectedSportId(key); setSelectedCourtId(null); }}
                  selectedCourtId={selectedCourtId}
                  onSelectCourt={setSelectedCourtId}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedStartAt={selectedStartAt}
                  onStartAtChange={setSelectedStartAt}
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                  availability={availability}
                  availabilityLoading={availabilityLoading}
                  availabilityError={availabilityError}
                  onRetry={() => setRetryKey((key) => key + 1)}
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
                selectedCourtId={selectedCourtId}
                selectedDate={selectedDate}
                selectedStartAt={selectedStartAt}
                selectedDuration={selectedDuration}
                availability={availability}
                isFormComplete={!!isFormComplete}
                onBook={handleBook}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE STICKY BAR ─── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
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
                  selectedCourtId={selectedCourtId}
                  selectedDate={selectedDate}
                  selectedStartAt={selectedStartAt}
                  selectedDuration={selectedDuration}
                  availability={availability}
                  isFormComplete={!!isFormComplete}
                  onBook={() => { handleBook(); setDrawerOpen(false); }}
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
      <div className="flex min-h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 via-[var(--surface-secondary)] to-[var(--surface)] px-6 text-center sm:min-h-48">
        <div>
          <MapPin className="mx-auto mb-3 size-8 text-[var(--accent)]" />
          <p className="font-semibold">{name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Không gian thể thao của PlayCourt</p>
        </div>
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
  sports, selectedSportId, onSportChange,
  selectedCourtId, onSelectCourt, selectedDate, onDateChange,
  selectedStartAt, onStartAtChange, selectedDuration, onDurationChange,
  availability, availabilityLoading, availabilityError, onRetry,
}: {
  sports: [number, string][];
  selectedSportId: Key | null;
  onSportChange: (id: Key | null) => void;
  selectedCourtId: Key | null;
  onSelectCourt: (id: Key | null) => void;
  selectedDate: DateValue | null;
  onDateChange: (date: DateValue | null) => void;
  selectedStartAt: string;
  onStartAtChange: (startAt: string) => void;
  selectedDuration: Key | null;
  onDurationChange: (duration: Key | null) => void;
  availability: VenueAvailabilityResponseDto | null;
  availabilityLoading: boolean;
  availabilityError: string | null;
  onRetry: () => void;
}) {
  const visibleCourts = availability?.courts.filter(({ sportId }) => sportId === Number(selectedSportId)) ?? [];
  const scheduleIndexes = getScheduleSlotIndexes(
    visibleCourts[0]?.slots ?? [],
    availability?.venue.openTime,
    availability?.venue.closeTime,
  );
  const selectedCourt = visibleCourts.find(({ id }) => id === Number(selectedCourtId));
  const selectedStartIndex = selectedCourt?.slots.findIndex(({ startAt }) => startAt === selectedStartAt) ?? -1;
  const durations = selectedCourt && selectedStartIndex >= 0 ? getBookableDurations(selectedCourt.slots, selectedStartIndex) : [];
  const duration = Number(selectedDuration);
  const [dragRange, setDragRange] = useState<{ courtId: number; startIndex: number; endIndex: number } | null>(null);
  const dragRef = useRef<{ court: VenueAvailabilityResponseDto["courts"][number]; startIndex: number; endIndex: number } | null>(null);
  const suppressClick = useRef(false);

  function selectRange(court: VenueAvailabilityResponseDto["courts"][number], startIndex: number, minutes: number) {
    if (!getBookableDurations(court.slots, startIndex).includes(minutes)) return;
    onSelectCourt(court.id);
    onStartAtChange(court.slots[startIndex].startAt);
    onDurationChange(String(minutes));
  }

  function handleSlotPointerDown(court: VenueAvailabilityResponseDto["courts"][number], index: number) {
    dragRef.current = { court, startIndex: index, endIndex: index };
    setDragRange({ courtId: court.id, startIndex: index, endIndex: index });

    const handlePointerMove = (event: PointerEvent) => {
      const target = (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-booking-slot]");
      if (!target || Number(target.dataset.courtId) !== court.id) return;
      const endIndex = Number(target.dataset.slotIndex);
      if (!Number.isInteger(endIndex)) return;
      const startIndex = Math.min(index, endIndex);
      const minutes = (Math.abs(endIndex - index) + 1) * 30;
      if (minutes > 30 && !getBookableDurations(court.slots, startIndex).includes(minutes)) return;
      dragRef.current = { court, startIndex: index, endIndex };
      setDragRange({ courtId: court.id, startIndex: index, endIndex });
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      const drag = dragRef.current;
      if (drag && drag.endIndex !== drag.startIndex) {
        const startIndex = Math.min(drag.startIndex, drag.endIndex);
        selectRange(drag.court, startIndex, (Math.abs(drag.endIndex - drag.startIndex) + 1) * 30);
        suppressClick.current = true;
        window.setTimeout(() => { suppressClick.current = false; }, 0);
      }
      dragRef.current = null;
      setDragRange(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  const statusClass: Record<string, string> = {
    Available: "!border-[var(--default-300)] !bg-[var(--surface)] hover:!border-[var(--accent)] hover:!bg-[var(--accent)]/10",
    Booked: "!border-red-300 !bg-red-400",
    Held: "!border-amber-300 !bg-amber-300",
    Maintenance: "!border-[var(--muted)]/30 !bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(0,0,0,.12)_4px,rgba(0,0,0,.12)_8px)]",
    Closed: "hidden",
  };
  const statusLabel: Record<string, string> = {
    Available: "Trống",
    Booked: "Đã đặt",
    Held: "Đang giữ",
    Maintenance: "Bảo trì",
    Closed: "Ngoài giờ",
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select className="w-full" placeholder="Chọn môn thể thao" value={selectedSportId} onChange={onSportChange}>
          <Label>Môn thể thao</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover><ListBox>{sports.map(([id, name]) => <ListBox.Item id={id} key={id} textValue={name}>{name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>

        <DatePicker className="w-full" value={selectedDate} onChange={onDateChange} minValue={today(getLocalTimeZone())} isDisabled={!selectedSportId}>
          <Label>Ngày chơi</Label>
          <DateField.Group>
            <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
            <DateField.Suffix><DatePicker.Trigger><CalendarIcon className="size-4" /></DatePicker.Trigger></DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover>
            <Calendar aria-label="Chọn ngày chơi" minValue={today(getLocalTimeZone())}>
              <Calendar.Header>
                <Calendar.YearPickerTrigger><Calendar.YearPickerTriggerHeading /><Calendar.YearPickerTriggerIndicator /></Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" /><Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>
      </div>

      {!selectedSportId && <p className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm">Chọn môn thể thao để xem các sân phù hợp.</p>}
      {selectedSportId && !selectedDate && <p className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm">Chọn ngày chơi để xem lịch sân.</p>}
      {availabilityLoading && <div aria-live="polite" className="space-y-2"><p className="text-sm font-medium">Đang tải lịch trống</p><Skeleton className="h-48 w-full rounded-xl" /></div>}
      {!availabilityLoading && availabilityError && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Không thể tải lịch trống</Alert.Title><Alert.Description>{availabilityError}</Alert.Description><Button className="mt-2" variant="secondary" onPress={onRetry}>Thử lại</Button></Alert.Content></Alert>}
      {!availabilityLoading && availability?.venue.isClosed && <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Sân đóng cửa ngày này</Alert.Title></Alert.Content></Alert>}

      {!availabilityLoading && !availabilityError && availability && !availability.venue.isClosed && visibleCourts.length > 0 && scheduleIndexes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Lịch sân</p>
            <p className="text-xs text-[var(--muted)]">Cuộn ngang để xem giờ</p>
          </div>
          <div role="group" aria-label="Chọn sân và khoảng giờ" className="max-w-full overflow-x-auto pb-2">
            <div className="space-y-2" style={{ minWidth: 150 + scheduleIndexes.length * 44 }}>
              <div className="grid text-xs text-[var(--muted)]" style={{ gridTemplateColumns: `150px repeat(${scheduleIndexes.length}, 44px)` }}>
                <span />
                {scheduleIndexes.map((slotIndex, index) => <span key={visibleCourts[0].slots[slotIndex].startAt} className="text-center">{index % 2 === 0 ? visibleCourts[0].slots[slotIndex].startAt.slice(11, 16) : ""}</span>)}
              </div>
              {visibleCourts.map((court) => (
                <div key={court.id} className="grid items-center" style={{ gridTemplateColumns: `150px repeat(${scheduleIndexes.length}, 44px)` }}>
                  <span className="pr-2 text-sm font-medium">{court.name}<small className="block font-normal text-[var(--muted)]">{court.sportName}</small></span>
                  {scheduleIndexes.map((slotIndex) => {
                    const slot = court.slots[slotIndex];
                    const choices = getBookableDurations(court.slots, slotIndex);
                    const dragSelected = dragRange?.courtId === court.id && slotIndex >= Math.min(dragRange.startIndex, dragRange.endIndex) && slotIndex <= Math.max(dragRange.startIndex, dragRange.endIndex);
                    const selected = dragSelected || (selectedCourtId === court.id && selectedStartIndex >= 0 && slotIndex >= selectedStartIndex && slotIndex < selectedStartIndex + duration / 30);
                    const enabled = slot.status === "Available" && slot.canStartBooking && choices.length > 0;
                    const defaultDuration = choices.includes(60) ? 60 : choices[0];
                    const unbookableAvailable = slot.status === "Available" && !enabled;
                    return <button key={slot.startAt} type="button" data-booking-slot data-court-id={court.id} data-slot-index={slotIndex} aria-label={`${court.name}, ${slot.startAt.slice(11, 16)}: ${statusLabel[slot.status] ?? slot.status}`} aria-pressed={selected} disabled={!enabled} onPointerDown={enabled ? () => handleSlotPointerDown(court, slotIndex) : undefined} onClick={enabled ? () => { if (suppressClick.current) return; selectRange(court, slotIndex, defaultDuration); } : undefined} className={`h-11 w-11 min-w-11 touch-none rounded-sm border p-0 ${enabled ? "cursor-pointer" : "cursor-not-allowed"} ${unbookableAvailable ? "opacity-35" : "opacity-100"} ${selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]" : statusClass[slot.status] ?? statusClass.Closed}`} />;
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]" aria-label="Chú thích trạng thái lịch">
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border border-[var(--default-300)] bg-[var(--surface)]" />Trống</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border border-red-300 bg-red-400" />Đã đặt</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border border-amber-300 bg-amber-300" />Đang giữ</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border border-[var(--muted)]/30 bg-[repeating-linear-gradient(135deg,transparent,transparent_2px,rgba(0,0,0,.12)_2px,rgba(0,0,0,.12)_4px)]" />Bảo trì</span>
          </div>
        </div>
      )}

      {!availabilityLoading && !availabilityError && availability && !availability.venue.isClosed && visibleCourts.length === 0 && <p className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm">Không có sân thuộc môn đã chọn.</p>}
      {!availabilityLoading && !availabilityError && visibleCourts.length > 0 && scheduleIndexes.length === 0 && <p className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm">Không có khung giờ cho ngày đã chọn.</p>}

      {selectedCourt && selectedStartIndex >= 0 && (
        <Card variant="secondary">
          <Card.Content className="grid gap-4 p-4 sm:grid-cols-[1fr_220px] sm:items-end">
            <div><p className="font-medium">{selectedCourt.name}</p><p className="mt-1 text-sm text-[var(--muted)]">Bắt đầu lúc {selectedStartAt.slice(11, 16)}</p></div>
            <Select aria-label="Thời lượng" value={selectedDuration} onChange={onDurationChange}>
              <Label>Thời lượng</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover><ListBox>{durations.map((minutes) => <ListBox.Item id={String(minutes)} key={minutes} textValue={`${minutes} phút`}>{minutes} phút<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            </Select>
          </Card.Content>
        </Card>
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
              {r.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                  {orderReviewImages(r.images).map((image) => (
                    <Image
                      key={image.id}
                      unoptimized
                      width={240}
                      height={240}
                      className="aspect-square w-full rounded-xl border border-[var(--border)] object-cover"
                      src={image.imageUrl}
                      alt={`Ảnh đánh giá của ${r.playerName}`}
                    />
                  ))}
                </div>
              )}
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
  selectedCourtId, selectedDate, selectedStartAt, selectedDuration,
  availability, isFormComplete, onBook,
}: {
  selectedCourtId: Key | null;
  selectedDate: DateValue | null;
  selectedStartAt: string;
  selectedDuration: Key | null;
  availability: VenueAvailabilityResponseDto | null;
  isFormComplete: boolean;
  onBook: () => void;
}) {
  const selectedAvailabilityCourt = availability?.courts.find(({ id }) => id === Number(selectedCourtId));
  const slots = selectedAvailabilityCourt?.slots ?? [];
  const selectedStartIndex = slots.findIndex(({ startAt }) => startAt === selectedStartAt);
  const duration = Number(selectedDuration);
  const selectedSlots = selectedStartIndex >= 0 && duration
    ? slots.slice(selectedStartIndex, selectedStartIndex + duration / 30)
    : [];
  const selectedEnd = selectedSlots.at(-1)?.endAt.slice(11, 16);
  const selectedTime = selectedStartAt.slice(11, 16);
  const selectedPrice = selectedSlots.length > 0 && selectedSlots.every(({ estimatedPrice }) => estimatedPrice != null)
    ? selectedSlots.reduce((sum, { estimatedPrice }) => sum + estimatedPrice!, 0)
    : null;

  return (
    <Card>
      <Card.Content className="space-y-4 p-5">
        <h3 className="text-lg font-bold">Thông tin đặt sân</h3>

        {selectedAvailabilityCourt && selectedDate && selectedStartAt && duration > 0 && selectedEnd && (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
            <p className="font-semibold">{selectedAvailabilityCourt.name}</p>
            <p className="mt-2 flex items-center gap-2 text-sm"><CalendarIcon className="size-4" />{selectedDate.toString()}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]"><Clock className="size-4" />{selectedTime}–{selectedEnd} · {duration} phút</p>
            {selectedPrice != null && <p className="mt-2 font-semibold text-[var(--accent)]">{formatVnd(selectedPrice)}</p>}
          </div>
        )}

        {!isFormComplete && <p className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">Chọn môn, ngày, sân và khoảng giờ trong tab “Sân & Lịch trống”.</p>}

        <Button className="w-full" size="lg" isDisabled={!isFormComplete} onPress={onBook}>
          TIẾP TỤC ĐẶT SÂN
        </Button>
      </Card.Content>
    </Card>
  );
}
