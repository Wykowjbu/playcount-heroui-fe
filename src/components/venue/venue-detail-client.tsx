"use client";

import { useState } from "react";
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
  Signal,
  Car,
  Cup,
  Flame,
  House,
  Droplet,
  Person,
  Calendar as CalendarIcon,
} from "@gravity-ui/icons";
import type {
  VenueDetail,
  CourtDetail,
  RatingStats,
  Review,
} from "@/mocks/venue-detail";

// ─── Icon mapping ───
const ICON_MAP: Record<string, React.ElementType> = {
  Signal, Car, Cup, Droplet, House, Flame,
};

// ─── Props ───
interface Props {
  venueId: string;
  venue: VenueDetail;
  courts: CourtDetail[];
  ratings: RatingStats;
  reviews: Review[];
}

// ─── Format ───
function formatPrice(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

// ─── Parse time string to @internationalized/date Time ───
function parseTime(timeStr: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return new Time(h, m);
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

export function VenueDetailClient({ venue, courts, ratings, reviews }: Props) {
  const [selectedCourtId, setSelectedCourtId] = useState<Key | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<Key | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);
  const availableCourts = courts.filter((c) => c.status === "available");

  const durationMin = selectedDuration ? Number(selectedDuration) : 0;
  const estimatedPrice =
    selectedCourt && durationMin
      ? (selectedCourt.pricePerHour * durationMin) / 60
      : 0;
  const isFormComplete = selectedCourtId && selectedDate && selectedTime && selectedDuration;

  const handleBook = () =>
    console.log("[BOOKING]", {
      courtId: selectedCourtId, date: selectedDate,
      time: selectedTime, duration: selectedDuration, estimatedPrice,
    });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ─── BREADCRUMB ─── */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2 sm:px-6 lg:px-8">
        <div className="hidden lg:block">
          <Breadcrumbs>
            <Breadcrumbs.Item href="/">Trang chủ</Breadcrumbs.Item>
            <Breadcrumbs.Item href="/#courts">Hồ Chí Minh</Breadcrumbs.Item>
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
        <HeroGallery images={venue.images} name={venue.name} />

        {/* ─── GRID ─── */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Chip color="success">
                <CircleCheck className="mr-1 inline size-3.5" />
                Đã duyệt
              </Chip>
              {venue.isOpen && (
                <Chip color="accent">
                  <CircleCheckFill className="mr-1 inline size-3.5" />
                  Đang mở cửa hôm nay
                </Chip>
              )}
            </div>

            <h1 className="text-2xl font-bold lg:text-3xl">{venue.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4 shrink-0" />{venue.address}
              </span>
              <span className="inline-flex items-center gap-1">
                <StarFill className="size-4 text-[var(--warning)]" />
                {ratings.average.toFixed(1)}/5.0
                <span className="text-xs">({ratings.total} đánh giá)</span>
              </span>
              <a className="inline-flex items-center gap-1 hover:text-[var(--foreground)]" href={`tel:${venue.phone}`}>
                <Smartphone className="size-4" />{venue.phone}
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {venue.amenities.slice(0, 4).map((a) => {
                const Icon = ICON_MAP[a.icon] ?? CircleCheck;
                return (
                  <Chip key={a.label} variant="soft">
                    <Icon className="mr-1 inline size-3.5" />{a.label}
                  </Chip>
                );
              })}
              {venue.amenities.length > 4 && (
                <Chip variant="soft">+{venue.amenities.length - 4} tiện ích nữa</Chip>
              )}
            </div>

            <Separator />

            {/* ─── TABS ─── */}
            <Tabs className="w-full" defaultSelectedKey="courts">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Chi tiết sân">
                  <Tabs.Tab id="courts">Sân & Lịch trống<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="reviews">Đánh giá<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="info">Giờ mở & Nội quy<Tabs.Indicator /></Tabs.Tab>
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
                <InfoTab venue={venue} />
              </Tabs.Panel>
            </Tabs>
          </div>

          {/* RIGHT — Booking Widget (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BookingWidget
                courts={availableCourts}
                selectedCourtId={selectedCourtId}
                onCourtChange={setSelectedCourtId}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
                selectedDuration={selectedDuration}
                onDurationChange={setSelectedDuration}
                estimatedPrice={estimatedPrice}
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
              {formatPrice(Math.min(...availableCourts.map((c) => c.pricePerHour)))}
              <span className="text-sm font-normal text-[var(--muted)]">/giờ</span>
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
                  courts={availableCourts}
                  selectedCourtId={selectedCourtId}
                  onCourtChange={setSelectedCourtId}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                  estimatedPrice={estimatedPrice}
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
        <img alt={name} className="h-64 w-full rounded-2xl object-cover lg:h-full" src={images[0]} />
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
  courts: CourtDetail[];
  selectedCourtId: Key | null;
  onSelectCourt: (id: Key | null) => void;
  selectedTime: string;
  onSelectTime: (t: string) => void;
}) {
  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {courts.map((court) => {
          const isSelected = court.id === selectedCourtId;
          const isDisabled = court.status === "maintenance";
          return (
            <button
              key={court.id}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${
                isSelected ? "border-[var(--accent)] bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
              } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              disabled={isDisabled}
              onClick={() => onSelectCourt(court.id)}
              type="button"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{court.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {court.sport} · {court.type === "indoor" ? "Trong nhà" : "Ngoài trời"}
                  </p>
                </div>
                <Chip color={court.status === "available" ? "success" : "warning"} size="sm">
                  {court.status === "available" ? "Trống" : "Bảo trì"}
                </Chip>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                {formatPrice(court.pricePerHour)}/giờ
              </p>
            </button>
          );
        })}
      </div>

      {selectedCourt && (
        <div className="space-y-3">
          <Separator />
          <p className="text-sm font-medium">Khung giờ trống — {selectedCourt.name}</p>
          <div className="flex flex-wrap gap-2">
            {selectedCourt.timeSlots.map((slot) => {
              const isBooked = slot.status === "booked";
              const isActive = selectedTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : isBooked
                        ? "cursor-not-allowed bg-[var(--surface-secondary)] text-[var(--muted)] opacity-50"
                        : "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 cursor-pointer"
                  }`}
                  disabled={isBooked}
                  onClick={() => onSelectTime(slot.startTime)}
                  type="button"
                >
                  {slot.startTime}{isBooked && " (Kín)"}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ───
function ReviewsTab({ ratings, reviews }: { ratings: RatingStats; reviews: Review[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-1">
          <p className="text-4xl font-bold">{ratings.average.toFixed(1)}</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarFill key={s} className={`size-4 ${s <= Math.round(ratings.average) ? "text-[var(--warning)]" : "text-[var(--muted)]"}`} />
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">{ratings.total} đánh giá</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratings.distribution[star] ?? 0;
            const pct = ratings.total > 0 ? (count / ratings.total) * 100 : 0;
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
        {reviews.map((r) => (
          <div key={r.id} className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
              <Person className="size-5 text-[var(--muted)]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{r.userName}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) =>
                    s <= r.rating ? (
                      <StarFill key={s} className="size-3 text-[var(--warning)]" />
                    ) : (
                      <Star key={s} className="size-3 text-[var(--muted)]" />
                    ),
                  )}
                </div>
                <span className="text-xs text-[var(--muted)]">{r.date}</span>
              </div>
              <p className="text-sm text-[var(--muted)]">{r.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Info Tab ───
function InfoTab({ venue }: { venue: VenueDetail }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Clock className="size-5" />Giờ mở cửa
        </h3>
        <ul className="space-y-2">
          {venue.openingHours.map((h, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CircleCheck className="size-4 text-[var(--success)]" />{h}
            </li>
          ))}
        </ul>
      </div>
      <Separator />
      <div>
        <h3 className="mb-3 font-semibold">Nội quy sân</h3>
        <ul className="space-y-2">
          {venue.rules.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
              <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-[var(--muted)]" />{r}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 font-semibold">Giới thiệu</h3>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{venue.description}</p>
      </div>
    </div>
  );
}

// ─── Booking Widget ───
function BookingWidget({
  courts, selectedCourtId, onCourtChange,
  selectedDate, onDateChange,
  selectedTime, onTimeChange,
  selectedDuration, onDurationChange,
  estimatedPrice, isFormComplete, onBook, phone,
}: {
  courts: CourtDetail[];
  selectedCourtId: Key | null;
  onCourtChange: (k: Key | null) => void;
  selectedDate: DateValue | null;
  onDateChange: (d: DateValue | null) => void;
  selectedTime: string;
  onTimeChange: (t: string) => void;
  selectedDuration: Key | null;
  onDurationChange: (k: Key | null) => void;
  estimatedPrice: number;
  isFormComplete: boolean;
  onBook: () => void;
  phone: string;
}) {
  return (
    <Card>
      <Card.Content className="space-y-4 p-5">
        <h3 className="text-lg font-bold">Xem giá theo sân</h3>

        <DatePicker className="w-full" value={selectedDate} onChange={onDateChange}>
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

        <Select
          className="w-full"
          placeholder="Chọn sân con"
          value={selectedCourtId}
          onChange={onCourtChange}
        >
          <Label>Sân</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {courts.map((c) => (
                <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                  {c.name} — {formatPrice(c.pricePerHour)}/giờ
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <TimeField
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
        </TimeField>

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

        {isFormComplete && (
          <div className="space-y-1 rounded-xl bg-[var(--surface-secondary)] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Ước tính tiền sân</span>
              <span className="font-bold text-[var(--accent)]">{formatPrice(estimatedPrice)}</span>
            </div>
            <p className="text-xs text-[var(--muted)]">Phí nền tảng sẽ hiển thị ở bước Checkout</p>
          </div>
        )}

        <Button className="w-full" size="lg" onPress={onBook}>TIẾP TỤC ĐẶT SÂN</Button>

        <div className="flex gap-2">
          <a
            className="flex-1 rounded-lg bg-[var(--surface-secondary)] px-3 py-1.5 text-center text-sm font-medium hover:bg-[var(--surface-tertiary)]"
            href={`tel:${phone}`}
          >
            Liên hệ chủ sân
          </a>
          <Button className="flex-1" variant="secondary" size="sm">Tạo kèo tại sân này</Button>
        </div>
      </Card.Content>
    </Card>
  );
}
