"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Modal, Skeleton } from "@heroui/react";
import { MapPin } from "@gravity-ui/icons";
import { getVenueAvailability, searchVenues } from "@/lib/api/discovery";
import type { VenueAvailabilityCourtDto, VenueAvailabilityResponseDto } from "@/lib/types/api";
import type { DiscoveryVenue } from "@/lib/types/discovery";

type MapInstance = { addControl: (control: unknown) => void; flyTo: (options: { center: [number, number]; zoom: number }) => void; remove: () => void };
type Mapbox = { accessToken: string; Map: new (options: Record<string, unknown>) => MapInstance; Marker: new (element?: HTMLElement) => { setLngLat: (coords: [number, number]) => { addTo: (map: MapInstance) => void } }; NavigationControl: new () => unknown };

declare global { interface Window { mapboxgl?: Mapbox } }

let mapboxPromise: Promise<Mapbox> | null = null;

function loadMapbox(): Promise<Mapbox> {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (mapboxPromise) return mapboxPromise;
  mapboxPromise = new Promise((resolve, reject) => {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.css";
    document.head.append(stylesheet);
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.js";
    script.onload = () => window.mapboxgl ? resolve(window.mapboxgl) : reject(new Error("Không tải được Mapbox"));
    script.onerror = () => reject(new Error("Không tải được Mapbox"));
    document.head.append(script);
  });
  return mapboxPromise;
}

interface Props {
  sportId: number | null;
  className?: string;
  onSelect: (selection: { courtId: number; locationDescription: string; startAt: string; endAt: string }) => void;
}

const statusLabel: Record<string, string> = { Available: "Trống", Booked: "Đã đặt", Held: "Đang giữ", Maintenance: "Bảo trì", Closed: "Ngoài giờ" };
const statusClass: Record<string, string> = {
  Available: "border-[var(--default-300)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10",
  Booked: "border-red-300 bg-red-400",
  Held: "border-amber-300 bg-amber-300",
  Maintenance: "border-[var(--muted)]/30 bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(0,0,0,.12)_4px,rgba(0,0,0,.12)_8px)]",
  Closed: "hidden",
};

function dateOptions() {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { value, label: offset === 0 ? "Hôm nay" : new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date) };
  });
}

function formatDuration(minutes: number) {
  return minutes % 60 === 0 ? `${minutes / 60} giờ` : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

function formatVnd(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

export function VenueMapPicker({ sportId, className, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [venues, setVenues] = useState<DiscoveryVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<DiscoveryVenue | null>(null);
  const [availability, setAvailability] = useState<VenueAvailabilityResponseDto | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => dateOptions()[0].value);
  const [selectedCourt, setSelectedCourt] = useState<VenueAvailabilityCourtDto | null>(null);
  const [selectedStartIndex, setSelectedStartIndex] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ courtId: number; index: number } | null>(null);
  const [error, setError] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const dates = useMemo(() => dateOptions(), []);
  const visibleCourts = useMemo(
    () => availability?.courts.filter((court) => sportId == null || court.sportId === sportId) ?? [],
    [availability, sportId],
  );
  const scheduleSlots = useMemo(() => {
    const slots = availability?.courts[0]?.slots ?? [];
    const open = availability?.venue.openTime?.slice(0, 5);
    const close = availability?.venue.closeTime?.slice(0, 5);
    return slots.map((slot, index) => ({ slot, index })).filter(({ slot }) =>
      slot.status !== "Closed" && (!open || slot.startAt.slice(11, 16) >= open) && (!close || slot.endAt.slice(11, 16) <= close),
    );
  }, [availability]);
  const selectedPrice = useMemo(() => {
    if (!selectedCourt || selectedStartIndex == null || !duration) return null;
    return selectedCourt.slots.slice(selectedStartIndex, selectedStartIndex + duration / 30).reduce((sum, slot) => sum + (slot.estimatedPrice ?? 0), 0);
  }, [duration, selectedCourt, selectedStartIndex]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    searchVenues({ sportId: sportId ?? undefined, pageSize: 50 })
      .then((result) => setVenues(result.items.filter((venue) => venue.latitude != null && venue.longitude != null)))
      .catch(() => setError("Không thể tải danh sách sân."));
  }, [isOpen, sportId]);

  useEffect(() => {
    if (!isOpen || !mapNode.current || !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return;
    let disposed = false;
    loadMapbox().then((mapboxgl) => {
      if (disposed || !mapNode.current) return;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
      const nextMap = new mapboxgl.Map({ container: mapNode.current, style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v12", center: [108.2022, 16.0544], zoom: 11 });
      nextMap.addControl(new mapboxgl.NavigationControl());
      map.current = nextMap;
      venues.forEach((venue) => {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.ariaLabel = `Chọn ${venue.name}`;
        marker.className = "size-8 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] shadow";
        marker.onclick = () => setSelectedVenue(venue);
        new mapboxgl.Marker(marker).setLngLat([venue.longitude!, venue.latitude!]).addTo(nextMap);
      });
    }).catch(() => setError("Không tải được bản đồ."));
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [isOpen, venues]);

  useEffect(() => {
    if (!selectedVenue) return;
    setSelectedCourt(null); setSelectedStartIndex(null); setDuration(null); setAvailability(null); setLoadingAvailability(true); setError("");
    getVenueAvailability(Number(selectedVenue.id), selectedDate)
      .then(setAvailability)
      .catch(() => setError("Không thể tải lịch trống."))
      .finally(() => setLoadingAvailability(false));
  }, [selectedVenue, selectedDate]);

  useEffect(() => {
    if (selectedCourt && !visibleCourts.some((court) => court.id === selectedCourt.id)) {
      setSelectedCourt(null); setSelectedStartIndex(null); setDuration(null);
    }
  }, [selectedCourt, visibleCourts]);

  function beginSelection(court: VenueAvailabilityCourtDto, index: number) {
    if (!court.slots[index].canStartBooking) return;
    setSelectedCourt(court); setSelectedStartIndex(index); setDuration(60); setDragStart({ courtId: court.id, index });
  }

  function extendSelection(court: VenueAvailabilityCourtDto, index: number) {
    if (!dragStart || dragStart.courtId !== court.id) return;
    const start = Math.min(dragStart.index, index);
    const end = Math.max(dragStart.index, index);
    const slots = court.slots.slice(start, end + 1);
    if (slots.length < 2 || slots.some((slot) => slot.status !== "Available")) return;
    setSelectedCourt(court); setSelectedStartIndex(start); setDuration(slots.length * 30);
  }

  function confirmSelection() {
    if (!selectedVenue || !selectedCourt || selectedStartIndex == null || !duration) return;
    const startAt = selectedCourt.slots[selectedStartIndex].startAt;
    const endAt = selectedCourt.slots[selectedStartIndex + duration / 30 - 1].endAt;
    onSelect({ courtId: selectedCourt.id, locationDescription: `${selectedVenue.name} · ${selectedVenue.address}`, startAt, endAt });
    setIsOpen(false);
  }

  return <>
    <Button className={className} variant="outline" onPress={() => setIsOpen(true)}><MapPin className="mr-1 size-4" />Chọn sân và giờ</Button>
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen} variant="blur">
        <Modal.Container size="cover" scroll="inside">
          <Modal.Dialog aria-label="Chọn sân và thời gian">
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Chọn sân và thời gian gần bạn</Modal.Heading></Modal.Header>
            <Modal.Body className="grid gap-4 lg:grid-cols-5">
              {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? <div ref={mapNode} className="min-h-96 rounded-[var(--radius)] lg:col-span-3" /> : <Alert className="lg:col-span-3" status="warning"><Alert.Indicator /><Alert.Content><Alert.Description>Thiếu cấu hình Mapbox.</Alert.Description></Alert.Content></Alert>}
              <Card className="lg:col-span-2"><Card.Content className="space-y-4 p-5">
                {!selectedVenue && <p className="text-sm text-[var(--muted)]">Chọn marker trên bản đồ để xem lịch sân.</p>}
                {selectedVenue && <>
                  <div><p className="font-semibold">{availability?.venue.name ?? selectedVenue.name}</p><p className="text-sm text-[var(--muted)]">{availability?.venue.address ?? selectedVenue.address}</p></div>
                  <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Chọn ngày">{dates.map((date) => <Button key={date.value} size="sm" variant={date.value === selectedDate ? "primary" : "outline"} onPress={() => setSelectedDate(date.value)}>{date.label}</Button>)}</div>
                  {loadingAvailability && <Skeleton className="h-48 w-full" />}
                  {!loadingAvailability && availability && <div className="space-y-3">
                    <div className="flex items-center justify-between"><p className="font-medium">Lịch sân</p><p className="text-xs text-[var(--muted)]">Cuộn ngang để xem giờ</p></div>
                    <div className="overflow-x-auto"><div className="space-y-2" style={{ minWidth: 150 + scheduleSlots.length * 40 }}>
                      <div className="grid text-xs text-[var(--muted)]" style={{ gridTemplateColumns: `150px repeat(${scheduleSlots.length}, 40px)` }}><span />{scheduleSlots.map(({ slot }, index) => <span key={slot.startAt} className="text-center">{index % 2 === 0 ? slot.startAt.slice(11, 16) : ""}</span>)}</div>
                      {visibleCourts.map((court) => <div key={court.id} className="grid items-center" style={{ gridTemplateColumns: `150px repeat(${scheduleSlots.length}, 40px)` }}>
                        <span className="pr-2 text-sm font-medium">{court.name}<small className="block font-normal text-[var(--muted)]">{court.sportName}</small></span>
                        {scheduleSlots.map(({ index: slotIndex }) => {
                          const slot = court.slots[slotIndex];
                          const selected = selectedCourt?.id === court.id && selectedStartIndex != null && slotIndex >= selectedStartIndex && slotIndex < selectedStartIndex + (duration ?? 0) / 30;
                          const visualStatus = selected ? "Selected" : slot.status;
                          const previousIndex = scheduleSlots.findIndex((entry) => entry.index === slotIndex) - 1;
                          const nextIndex = previousIndex + 2;
                          const previous = previousIndex >= 0 ? court.slots[scheduleSlots[previousIndex].index] : undefined;
                          const next = nextIndex < scheduleSlots.length ? court.slots[scheduleSlots[nextIndex].index] : undefined;
                          const previousStatus = previous && selectedCourt?.id === court.id && selectedStartIndex != null && scheduleSlots[previousIndex].index >= selectedStartIndex && scheduleSlots[previousIndex].index < selectedStartIndex + (duration ?? 0) / 30 ? "Selected" : previous?.status;
                          const nextStatus = next && selectedCourt?.id === court.id && selectedStartIndex != null && scheduleSlots[nextIndex].index >= selectedStartIndex && scheduleSlots[nextIndex].index < selectedStartIndex + (duration ?? 0) / 30 ? "Selected" : next?.status;
                          return <Button key={slot.startAt} size="sm" aria-label={`${court.name}, ${slot.startAt.slice(11, 16)}: ${statusLabel[slot.status] ?? slot.status}`} isDisabled={slot.status !== "Available"} onPointerDown={() => beginSelection(court, slotIndex)} onPointerEnter={() => extendSelection(court, slotIndex)} onPointerUp={() => setDragStart(null)} onPointerCancel={() => setDragStart(null)} className={`!h-10 !w-10 !min-w-10 !border !p-0 disabled:!opacity-100 ${previousStatus === visualStatus ? "!-ml-px !rounded-none" : "!rounded-l-sm"} ${nextStatus === visualStatus ? "!rounded-none" : "!rounded-r-sm"} ${selected ? "!border-[var(--accent)] !bg-[var(--accent)] !text-[var(--accent-foreground)]" : statusClass[slot.status] ?? statusClass.Closed}`} />;
                        })}
                      </div>)}
                    </div></div>
                    {!visibleCourts.length && <p className="text-sm text-[var(--muted)]">Không có sân thuộc môn đã chọn.</p>}
                    <p className="text-xs text-[var(--muted)]">Trống · Đã đặt · Đang giữ · Bảo trì · Ngoài giờ</p>
                  </div>}
                  {selectedCourt && selectedStartIndex != null && <div className="rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3"><p className="font-medium">Thông tin đặt sân</p><p className="mt-1 text-sm">{selectedCourt.name}</p><p className="text-sm text-[var(--muted)]">{selectedCourt.slots[selectedStartIndex].startAt.slice(11, 16)}–{duration ? selectedCourt.slots[selectedStartIndex + duration / 30 - 1].endAt.slice(11, 16) : ""} · {duration ? formatDuration(duration) : ""}</p><p className="mt-2 font-semibold">Giá dự kiến: {selectedPrice == null ? "Chưa có giá" : formatVnd(selectedPrice)}</p></div>}
                </>}
                {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
              </Card.Content></Card>
            </Modal.Body>
            <Modal.Footer><Button slot="close" variant="tertiary">Hủy</Button><Button variant="primary" isDisabled={!selectedCourt || selectedStartIndex == null || !duration} onPress={confirmSelection}>Chọn sân và thời gian</Button></Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  </>;
}
