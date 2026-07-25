"use client";

import type { CalendarDate } from "@internationalized/date";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { Alert, Button, Card, Calendar, Modal, Popover, Skeleton, Spinner } from "@heroui/react";
import { MapPin } from "@gravity-ui/icons";
import { getVenueAvailability, searchVenues } from "@/lib/api/discovery";
import type { VenueAvailabilityCourtDto, VenueAvailabilityResponseDto } from "@/lib/types/api";
import type { DiscoveryVenue } from "@/lib/types/discovery";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getBookableDurations, getScheduleSlotIndexes } from "@/lib/utils/player-flow";

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
  const [dragCourt, setDragCourt] = useState<VenueAvailabilityCourtDto | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);
  const isDragging = useRef(false);
  const dragCourtRef = useRef<VenueAvailabilityCourtDto | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapAttempt, setMapAttempt] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const visibleCourts = useMemo(() => availability?.courts.filter((court) => sportId == null || court.sportId === sportId) ?? [], [availability, sportId]);
  const scheduleSlots = useMemo(() => {
    const slots = availability?.courts[0]?.slots ?? [];
    return getScheduleSlotIndexes(slots, availability?.venue.openTime, availability?.venue.closeTime)
      .map((index) => ({ slot: slots[index], index }));
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

  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!isOpen || !mapNode.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) { setMapStatus("error"); return; }
    let disposed = false;
    let loadedCb: (() => void) | undefined;
    let failedCb: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;
    setMapStatus("loading");
    try {
      mapboxgl.accessToken = token;
      const nextMap = new mapboxgl.Map({ container: mapNode.current, style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v12", center: userLocation ?? [0, 0], zoom: userLocation ? 12 : 2 });
      let loadedOk = false;
      const failed = () => { if (!disposed && !loadedOk) setMapStatus("error"); };
      const loaded = () => {
        if (disposed) return;
        loadedOk = true;
        nextMap.off("error", failed);
        requestAnimationFrame(() => { if (!disposed) nextMap.resize(); });
        resizeObserver = new ResizeObserver(() => { if (!disposed) nextMap.resize(); });
        resizeObserver.observe(mapNode.current!);
        setMapStatus("ready");
      };
      nextMap.addControl(new mapboxgl.NavigationControl());
      nextMap.on("load", loaded);
      nextMap.on("error", failed);
      loadedCb = loaded;
      failedCb = failed;
      map.current = nextMap;
    } catch { setMapStatus("error"); }
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (loadedCb) map.current?.off("load", loadedCb);
      if (failedCb) map.current?.off("error", failedCb);
      map.current?.remove();
      map.current = null;
    };
  }, [isOpen, mapAttempt]);

  useEffect(() => {
    const nextMap = map.current;
    if (!nextMap) return;
    function updateWhenReady() { nextMap!.off("idle", updateWhenReady); updateMarkers(); }
    const ready = typeof nextMap.isStyleLoaded === "function" && nextMap.isStyleLoaded();
    if (!ready) {
      nextMap.on("idle", updateWhenReady);
      return () => { nextMap.off("idle", updateWhenReady); };
    }
    updateMarkers();
    function updateMarkers() {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      const located = venues.filter((v) => v.latitude != null && v.longitude != null);
      markersRef.current = located.map((venue) => {
        const el = document.createElement("button");
        el.type = "button";
        el.ariaLabel = `Xem ${venue.name} trên bản đồ`;
        el.className = "size-11 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] shadow";
        el.onclick = () => setSelectedVenue(venue);
        return new mapboxgl.Marker(el).setLngLat([venue.longitude!, venue.latitude!]).addTo(nextMap!);
      });
      if (located.length > 0 && !selectedVenue) {
        const bounds = new mapboxgl.LngLatBounds();
        located.forEach((v) => bounds.extend([v.longitude!, v.latitude!]));
        nextMap!.fitBounds(bounds, { padding: 56, maxZoom: 14 });
      }
    }
  }, [venues]);

  useEffect(() => {
    if (!selectedVenue?.latitude || !selectedVenue?.longitude) return;
    map.current?.flyTo({ center: [selectedVenue.longitude, selectedVenue.latitude], zoom: 15, duration: 800 });
  }, [selectedVenue]);

  useEffect(() => {
    if (!userLocation || !map.current) return;
    if (!venues.length) map.current.flyTo({ center: userLocation, zoom: 12 });
  }, [userLocation, venues.length]);

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

  function handleSlotPointerDown(court: VenueAvailabilityCourtDto, index: number) {
    isDragging.current = true;
    dragCourtRef.current = court;
    setDragCourt(court);
    setDragStartIndex(index);
    setDragEndIndex(index);
    document.addEventListener("pointermove", handleDocPointerMove);
    document.addEventListener("pointerup", handleDocPointerUp);
  }

  function handleDocPointerMove(e: PointerEvent) {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const idx = el?.dataset?.slotIndex;
    if (idx != null) setDragEndIndex(Number(idx));
  }

  function handleDocPointerUp() {
    document.removeEventListener("pointermove", handleDocPointerMove);
    document.removeEventListener("pointerup", handleDocPointerUp);
    const court = dragCourtRef.current;
    if (!isDragging.current || !court) { isDragging.current = false; return; }
    isDragging.current = false;
    setDragStartIndex((dragStart) => {
      setDragEndIndex((dragEnd) => {
        if (dragStart == null || dragEnd == null) { resetDrag(); return dragEnd; }
        const start = Math.min(dragStart, dragEnd);
        const end = Math.max(dragStart, dragEnd);
        const allAvailable = court.slots.slice(start, end + 1).every((s) => s.status === "Available");
        if (!allAvailable) { resetDrag(); return dragEnd; }
        const slotCount = end - start + 1;
        const finalDuration = slotCount * 30;
        setSelectedCourt(court);
        setSelectedStartIndex(start);
        setDuration(finalDuration);
        resetDrag();
        return dragEnd;
      });
      return dragStart;
    });
  }

  function resetDrag() {
    setDragCourt(null);
    setDragStartIndex(null);
    setDragEndIndex(null);
    dragCourtRef.current = null;
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
                  <p className="font-medium">Chọn sân {venues.length > 0 && <span className="font-normal text-[var(--muted)]">({venues.length})</span>}</p>
                  {venuesLoading && <Skeleton className="h-24 w-full" />}
                  {venuesError && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{venuesError}</Alert.Description></Alert.Content></Alert>}
                  {!venuesLoading && !venuesError && <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                    {venues.map((venue) => <Button key={venue.id} aria-pressed={selectedVenue?.id === venue.id} className="min-h-10 w-full justify-start text-left" size="sm" variant={selectedVenue?.id === venue.id ? "primary" : "outline"} onPress={() => setSelectedVenue(venue)}>{venue.name}</Button>)}
                  </div>}
                  {!venuesLoading && !venuesError && !venues.length && <p className="text-sm text-[var(--muted)]">Không tìm thấy sân phù hợp.</p>}
                </div>
                {selectedVenue && <>
                  <div><p className="font-semibold">{availability?.venue.name ?? selectedVenue.name}</p><p className="text-sm text-[var(--muted)]">{availability?.venue.address ?? selectedVenue.address}</p></div>
                  <Popover>
                    <Popover.Trigger>
                      <Button className="min-h-11" variant="outline">
                        📅 {(() => { const d = parseDate(selectedDate); return d.toDate(getLocalTimeZone()).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }); })()}
                      </Button>
                    </Popover.Trigger>
                    <Popover.Content>
                      <Calendar
                        value={parseDate(selectedDate)}
                        onChange={(d) => setSelectedDate(d.toString())}
                        minValue={today(getLocalTimeZone())}
                        maxValue={today(getLocalTimeZone()).add({ days: 30 })}
                      >
                        <Calendar.Header>
                          <Calendar.NavButton slot="previous" />
                          <Calendar.Heading />
                          <Calendar.NavButton slot="next" />
                        </Calendar.Header>
                        <Calendar.Grid>
                          <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar>
                    </Popover.Content>
                  </Popover>
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
                          const isDragActive = !!dragCourt && dragCourt.id === court.id && dragStartIndex != null && dragEndIndex != null && index >= Math.min(dragStartIndex, dragEndIndex) && index <= Math.max(dragStartIndex, dragEndIndex);
                          const isSelected = selectedCourt?.id === court.id && selectedStartIndex != null && index >= selectedStartIndex && index < selectedStartIndex + (duration ?? 0) / 30;
                          const selected = isDragActive || isSelected;
                          const enabled = slot.status === "Available";
                          return <div key={slot.startAt} role="button" tabIndex={enabled ? 0 : -1} data-slot-court={court.id} data-slot-index={index} aria-label={`${court.name}, ${slot.startAt.slice(11, 16)}: ${statusLabel[slot.status] ?? slot.status}`} aria-pressed={selected} onPointerDown={enabled ? () => handleSlotPointerDown(court, index) : undefined} className={`!h-11 !w-11 !min-w-11 !rounded-sm !border !p-0 ${enabled ? "cursor-pointer" : ""} ${selected ? "!border-[var(--accent)] !bg-[var(--accent)] !text-[var(--accent-foreground)]" : statusClass[slot.status] ?? statusClass.Closed}`} />;
                        })}
                      </div>)}
                    </div></div>
                    {!visibleCourts.length && <p className="text-sm text-[var(--muted)]">Không có sân thuộc môn đã chọn.</p>}
                    <p className="text-xs text-[var(--muted)]">Trống · Đã đặt · Đang giữ · Bảo trì · Ngoài giờ</p>
                  </div>}
                  {selectedCourt && selectedStartIndex != null && <div className="space-y-3 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3">
                    <div><p className="font-medium">Thông tin đặt sân</p><p className="mt-1 text-sm">{selectedCourt.name}</p></div>
                    {duration && <p className="text-sm">Thời lượng: {formatDuration(duration)}</p>}
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
