"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Label, ListBox, Modal, Select, Skeleton, Spinner } from "@heroui/react";
import { MapPin } from "@gravity-ui/icons";
import { getVenueAvailability, searchVenues } from "@/lib/api/discovery";
import type { VenueAvailabilityCourtDto, VenueAvailabilityResponseDto } from "@/lib/types/api";
import type { DiscoveryVenue } from "@/lib/types/discovery";
import { loadMapbox, type MapInstance, type MarkerInstance } from "@/lib/mapbox";
import { getBookableDurations } from "@/lib/utils/player-flow";

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

const formatDuration = (minutes: number) => minutes % 60 === 0 ? `${minutes / 60} giờ` : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
const formatVnd = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;

export function VenueMapPicker({ sportId, className, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [venues, setVenues] = useState<DiscoveryVenue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venuesError, setVenuesError] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<DiscoveryVenue | null>(null);
  const [availability, setAvailability] = useState<VenueAvailabilityResponseDto | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => dateOptions()[0].value);
  const [selectedCourt, setSelectedCourt] = useState<VenueAvailabilityCourtDto | null>(null);
  const [selectedStartIndex, setSelectedStartIndex] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapAttempt, setMapAttempt] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const dates = useMemo(() => dateOptions(), []);
  const visibleCourts = useMemo(() => availability?.courts.filter((court) => sportId == null || court.sportId === sportId) ?? [], [availability, sportId]);
  const scheduleSlots = useMemo(() => {
    const slots = availability?.courts[0]?.slots ?? [];
    const open = availability?.venue.openTime?.slice(0, 5);
    const close = availability?.venue.closeTime?.slice(0, 5);
    return slots.map((slot, index) => ({ slot, index })).filter(({ slot }) =>
      slot.status !== "Closed" && (!open || slot.startAt.slice(11, 16) >= open) && (!close || slot.endAt.slice(11, 16) <= close));
  }, [availability]);
  const durations = useMemo(() => selectedCourt && selectedStartIndex != null ? getBookableDurations(selectedCourt.slots, selectedStartIndex) : [], [selectedCourt, selectedStartIndex]);
  const selectedPrice = useMemo(() => {
    if (!selectedCourt || selectedStartIndex == null || !duration) return null;
    const slots = selectedCourt.slots.slice(selectedStartIndex, selectedStartIndex + duration / 30);
    return slots.some((slot) => slot.estimatedPrice == null) ? null : slots.reduce((sum, slot) => sum + slot.estimatedPrice!, 0);
  }, [duration, selectedCourt, selectedStartIndex]);
  const canConfirm = !!selectedVenue
    && venues.some((venue) => venue.id === selectedVenue.id)
    && !!selectedCourt
    && visibleCourts.some((court) => court.id === selectedCourt.id)
    && selectedStartIndex != null
    && duration != null
    && getBookableDurations(selectedCourt.slots, selectedStartIndex).includes(duration);

  useEffect(() => {
    setSelectedVenue(null);
    setSelectedCourt(null);
    setSelectedStartIndex(null);
    setDuration(null);
    setAvailability(null);
    setAvailabilityError("");
  }, [sportId]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setVenuesLoading(true);
    setVenuesError("");
    searchVenues({ sportId: sportId ?? undefined, pageSize: 50 })
      .then((result) => { if (active) setVenues(result.items); })
      .catch(() => { if (active) setVenuesError("Không thể tải danh sách sân."); })
      .finally(() => { if (active) setVenuesLoading(false); });
    navigator.geolocation?.getCurrentPosition(({ coords }) => setUserLocation([coords.longitude, coords.latitude]), () => {});
    return () => { active = false; };
  }, [isOpen, sportId]);

  useEffect(() => {
    if (!isOpen || venuesLoading || !mapNode.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) { setMapStatus("error"); return; }
    let disposed = false;
    let markers: MarkerInstance[] = [];
    let loadedListener: (() => void) | undefined;
    let failedListener: (() => void) | undefined;
    setMapStatus("loading");
    loadMapbox().then((mapboxgl) => {
      if (disposed || !mapNode.current) return;
      mapboxgl.accessToken = token;
      const nextMap = new mapboxgl.Map({ container: mapNode.current, style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v12", center: userLocation ?? [0, 0], zoom: userLocation ? 12 : 2 });
      let loadedSuccessfully = false;
      const failed = () => { if (!disposed && !loadedSuccessfully) setMapStatus("error"); };
      const loaded = () => {
        if (disposed) return;
        loadedSuccessfully = true;
        nextMap.off("error", failed);
        const located = venues.filter((venue) => venue.latitude != null && venue.longitude != null);
        markers = located.map((venue) => {
          const marker = document.createElement("button");
          marker.type = "button";
          marker.ariaLabel = `Xem ${venue.name} trên bản đồ`;
          marker.className = "size-11 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] shadow";
          marker.onclick = () => setSelectedVenue(venue);
          return new mapboxgl.Marker(marker).setLngLat([venue.longitude!, venue.latitude!]).addTo(nextMap);
        });
        if (located.length && mapboxgl.LngLatBounds && nextMap.fitBounds) {
          const bounds = new mapboxgl.LngLatBounds();
          located.forEach((venue) => bounds.extend([venue.longitude!, venue.latitude!]));
          nextMap.fitBounds(bounds, { padding: 56, maxZoom: 14 });
        } else if (userLocation) {
          nextMap.flyTo({ center: userLocation, zoom: 12 });
        }
        setMapStatus("ready");
      };
      nextMap.addControl(new mapboxgl.NavigationControl());
      nextMap.on("load", loaded);
      nextMap.on("error", failed);
      loadedListener = loaded;
      failedListener = failed;
      map.current = nextMap;
    }).catch(() => { if (!disposed) setMapStatus("error"); });
    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove?.());
      if (loadedListener) map.current?.off("load", loadedListener);
      if (failedListener) map.current?.off("error", failedListener);
      map.current?.remove();
      map.current = null;
    };
  }, [isOpen, mapAttempt, userLocation, venues, venuesLoading]);

  useEffect(() => {
    if (!selectedVenue) return;
    let active = true;
    setSelectedCourt(null); setSelectedStartIndex(null); setDuration(null); setAvailability(null); setLoadingAvailability(true); setAvailabilityError("");
    getVenueAvailability(Number(selectedVenue.id), selectedDate)
      .then((result) => { if (active) setAvailability(result); })
      .catch(() => { if (active) setAvailabilityError("Không thể tải lịch trống."); })
      .finally(() => { if (active) setLoadingAvailability(false); });
    return () => { active = false; };
  }, [availabilityAttempt, selectedVenue, selectedDate]);

  function beginSelection(court: VenueAvailabilityCourtDto, index: number) {
    const choices = getBookableDurations(court.slots, index);
    if (!choices.length) return;
    setSelectedCourt(court); setSelectedStartIndex(index); setDuration(choices[0]);
  }

  function confirmSelection() {
    if (!canConfirm || !selectedVenue || !selectedCourt || selectedStartIndex == null || !duration) return;
    onSelect({
      courtId: selectedCourt.id,
      locationDescription: `${selectedVenue.name} · ${selectedVenue.address}`,
      startAt: selectedCourt.slots[selectedStartIndex].startAt,
      endAt: selectedCourt.slots[selectedStartIndex + duration / 30 - 1].endAt,
    });
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
              <div className="relative min-h-80 overflow-hidden rounded-[var(--radius)] bg-[var(--default-100)] lg:col-span-3">
                <div ref={mapNode} data-testid="match-venue-map" data-map-status={mapStatus} className="absolute inset-0" />
                {mapStatus === "loading" && <div role="status" className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[var(--surface)]/90"><Spinner />Đang tải bản đồ…</div>}
                {mapStatus === "error" && <div className="absolute inset-0 z-10 flex items-center justify-center p-6"><Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Description>{process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? "Không tải được bản đồ." : "Thiếu cấu hình Mapbox."}</Alert.Description></Alert.Content>{process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && <Button variant="outline" size="sm" onPress={() => setMapAttempt((value) => value + 1)}>Thử lại bản đồ</Button>}</Alert></div>}
              </div>
              <Card className="lg:col-span-2"><Card.Content className="space-y-4 p-5">
                <div role="group" aria-label="Danh sách sân có thể chọn" className="space-y-2">
                  <p className="font-medium">Chọn sân</p>
                  {venuesLoading && <Skeleton className="h-24 w-full" />}
                  {venuesError && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{venuesError}</Alert.Description></Alert.Content></Alert>}
                  {!venuesLoading && !venuesError && venues.map((venue) => <Button key={venue.id} aria-pressed={selectedVenue?.id === venue.id} className="min-h-11 w-full justify-start text-left" variant={selectedVenue?.id === venue.id ? "primary" : "outline"} onPress={() => setSelectedVenue(venue)}>Chọn {venue.name}</Button>)}
                  {!venuesLoading && !venuesError && !venues.length && <p className="text-sm text-[var(--muted)]">Không tìm thấy sân phù hợp.</p>}
                </div>
                {selectedVenue && <>
                  <div><p className="font-semibold">{availability?.venue.name ?? selectedVenue.name}</p><p className="text-sm text-[var(--muted)]">{availability?.venue.address ?? selectedVenue.address}</p></div>
                  <div role="group" className="flex gap-2 overflow-x-auto pb-1" aria-label="Chọn ngày">{dates.map((date) => <Button key={date.value} aria-pressed={date.value === selectedDate} className="min-h-11" size="sm" variant={date.value === selectedDate ? "primary" : "outline"} onPress={() => setSelectedDate(date.value)}>{date.label}</Button>)}</div>
                  {loadingAvailability && <Skeleton className="h-48 w-full" />}
                  {availabilityError && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{availabilityError}</Alert.Description></Alert.Content><Button size="sm" variant="danger" onPress={() => setAvailabilityAttempt((value) => value + 1)}>Thử lại</Button></Alert>}
                  {!loadingAvailability && availability && <div className="space-y-3">
                    <div className="flex items-center justify-between"><p className="font-medium">Lịch sân</p><p className="text-xs text-[var(--muted)]">Cuộn ngang để xem giờ</p></div>
                    <div role="group" aria-label="Chọn giờ bắt đầu" className="overflow-x-auto"><div className="space-y-2" style={{ minWidth: 150 + scheduleSlots.length * 44 }}>
                      <div className="grid text-xs text-[var(--muted)]" style={{ gridTemplateColumns: `150px repeat(${scheduleSlots.length}, 44px)` }}><span />{scheduleSlots.map(({ slot }, index) => <span key={slot.startAt} className="text-center">{index % 2 === 0 ? slot.startAt.slice(11, 16) : ""}</span>)}</div>
                      {visibleCourts.map((court) => <div key={court.id} className="grid items-center" style={{ gridTemplateColumns: `150px repeat(${scheduleSlots.length}, 44px)` }}>
                        <span className="pr-2 text-sm font-medium">{court.name}<small className="block font-normal text-[var(--muted)]">{court.sportName}</small></span>
                        {scheduleSlots.map(({ index }) => {
                          const slot = court.slots[index];
                          const selected = selectedCourt?.id === court.id && selectedStartIndex != null && index >= selectedStartIndex && index < selectedStartIndex + (duration ?? 0) / 30;
                          const enabled = slot.status === "Available" && slot.canStartBooking && getBookableDurations(court.slots, index).length > 0;
                          return <Button key={slot.startAt} size="sm" aria-label={`${court.name}, ${slot.startAt.slice(11, 16)}: ${statusLabel[slot.status] ?? slot.status}`} aria-pressed={selected} isDisabled={!enabled} onPress={() => beginSelection(court, index)} className={`!h-11 !w-11 !min-w-11 !rounded-sm !border !p-0 disabled:!opacity-100 ${selected ? "!border-[var(--accent)] !bg-[var(--accent)] !text-[var(--accent-foreground)]" : statusClass[slot.status] ?? statusClass.Closed}`} />;
                        })}
                      </div>)}
                    </div></div>
                    {!visibleCourts.length && <p className="text-sm text-[var(--muted)]">Không có sân thuộc môn đã chọn.</p>}
                    <p className="text-xs text-[var(--muted)]">Trống · Đã đặt · Đang giữ · Bảo trì · Ngoài giờ</p>
                  </div>}
                  {selectedCourt && selectedStartIndex != null && <div className="space-y-3 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3">
                    <div><p className="font-medium">Thông tin đặt sân</p><p className="mt-1 text-sm">{selectedCourt.name}</p></div>
                    <Select aria-label="Thời lượng" value={duration} onChange={(key) => setDuration(key == null ? null : Number(key))}>
                      <Label>Thời lượng</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                      <Select.Popover><ListBox>{durations.map((minutes) => <ListBox.Item key={minutes} id={minutes} textValue={formatDuration(minutes)}>{formatDuration(minutes)}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                    </Select>
                    <p className="text-sm text-[var(--muted)]">{selectedCourt.slots[selectedStartIndex].startAt.slice(11, 16)}–{duration ? selectedCourt.slots[selectedStartIndex + duration / 30 - 1].endAt.slice(11, 16) : ""}</p>
                    <p className="font-semibold">Giá dự kiến: {selectedPrice == null ? "Chưa có giá" : formatVnd(selectedPrice)}</p>
                  </div>}
                </>}
              </Card.Content></Card>
            </Modal.Body>
            <Modal.Footer><Button slot="close" variant="tertiary">Hủy</Button><Button variant="primary" isDisabled={!canConfirm} onPress={confirmSelection}>Chọn sân và thời gian</Button></Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  </>;
}
