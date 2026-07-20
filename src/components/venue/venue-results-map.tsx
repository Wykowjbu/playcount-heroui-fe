"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Skeleton } from "@heroui/react";
import ArrowLeft from "@gravity-ui/icons/ArrowLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DiscoveryVenue } from "@/lib/types/discovery";

interface Props {
  venues: DiscoveryVenue[];
  onShowList: () => void;
}

const hasCoordinates = (venue: DiscoveryVenue) =>
  typeof venue.latitude === "number" && Number.isFinite(venue.latitude) && venue.latitude >= -90 && venue.latitude <= 90
  && typeof venue.longitude === "number" && Number.isFinite(venue.longitude) && venue.longitude >= -180 && venue.longitude <= 180;

export function VenueResultsMap({ venues, onShowList }: Props) {
  const mappedVenues = useMemo(() => venues.filter(hasCoordinates), [venues]);
  const [selected, setSelected] = useState<DiscoveryVenue | null>(() => mappedVenues[0] ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const markerElements = useRef(new Map<string, HTMLButtonElement>());
  const selectedId = useRef(selected?.id);

  useEffect(() => {
    setSelected((current) => mappedVenues.find((venue) => venue.id === current?.id) ?? mappedVenues[0] ?? null);
  }, [mappedVenues]);

  useEffect(() => {
    selectedId.current = selected?.id;
    markerElements.current.forEach((element, venueId) => {
      element.ariaPressed = String(venueId === selected?.id);
    });
  }, [selected]);

  useEffect(() => {
    if (!mappedVenues.length || !mapNode.current) {
      setStatus("ready");
      return;
    }
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      setStatus("error");
      return;
    }

    let disposed = false;
    let loadedMap: (() => void) | null = null;
    let failedMap: (() => void) | null = null;
    const nextMarkerElements = new Map<string, HTMLButtonElement>();
    setStatus("loading");
    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
      const first = mappedVenues[0];
      const nextMap = new mapboxgl.Map({
        container: mapNode.current,
        style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v12",
        center: [first.longitude!, first.latitude!],
        zoom: mappedVenues.length === 1 ? 14 : 11,
      });
      loadedMap = () => {
        if (!disposed) setStatus("ready");
      };
      failedMap = () => {
        if (!disposed) setStatus("error");
      };
      nextMap.on("load", loadedMap);
      nextMap.on("error", failedMap);
      nextMap.addControl(new mapboxgl.NavigationControl());
      map.current = nextMap;
      markers.current = mappedVenues.map((venue) => {
        const el = document.createElement("button");
        el.type = "button";
        el.ariaLabel = `Chọn ${venue.name}`;
        el.ariaPressed = String(venue.id === selectedId.current);
        el.className = "size-11 cursor-pointer rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
        el.innerHTML = '<span aria-hidden="true">●</span>';
        el.addEventListener("click", () => setSelected(venue));
        nextMarkerElements.set(venue.id, el);
        return new mapboxgl.Marker(el).setLngLat([venue.longitude!, venue.latitude!]).addTo(nextMap);
      });
      markerElements.current = nextMarkerElements;
      if (mappedVenues.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        mappedVenues.forEach((venue) => bounds.extend([venue.longitude!, venue.latitude!]));
        nextMap.fitBounds(bounds, { padding: 52, maxZoom: 14 });
      }
    } catch { if (!disposed) setStatus("error"); }

    return () => {
      disposed = true;
      if (map.current && loadedMap && failedMap) {
        map.current.off("load", loadedMap);
        map.current.off("error", failedMap);
      }
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      nextMarkerElements.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [attempt, mappedVenues]);

  const retry = () => setAttempt((value) => value + 1);

  return (
    <div className="relative grid min-w-0 gap-4 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
      <section aria-label="Danh sách sân cạnh bản đồ" className="hidden max-h-[36rem] space-y-2 overflow-y-auto lg:block">
        {venues.map((venue) => (
          <button key={venue.id} type="button" disabled={!hasCoordinates(venue)} aria-pressed={selected?.id === venue.id} onClick={() => setSelected(venue)} className="min-h-20 w-full cursor-pointer rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] disabled:cursor-default">
            <span className="block font-semibold text-[var(--foreground)]">{venue.name}</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">{venue.address}</span>
            {!hasCoordinates(venue) && <span className="mt-1 block text-xs text-[var(--muted)]">Chưa có vị trí bản đồ</span>}
          </button>
        ))}
      </section>

      <div className="relative min-h-[32rem] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-secondary)]" data-testid="venue-results-map" data-map-status={status}>
        <Button className="absolute left-3 top-3 z-20 min-h-11 lg:hidden" variant="secondary" onPress={onShowList}>
          <ArrowLeft className="size-4" />Xem danh sách
        </Button>
        <div ref={mapNode} className="absolute inset-0" role="region" aria-label="Bản đồ vị trí sân bãi" />
        {status === "loading" && <div role="status" aria-live="polite" className="absolute inset-0 grid place-items-center bg-[var(--surface)]/90"><Skeleton className="h-full w-full" /><p className="absolute text-sm text-[var(--muted)]">Đang tải bản đồ…</p></div>}
        {!mappedVenues.length && <div className="absolute inset-0 grid place-items-center p-6 text-center"><div><MapPin className="mx-auto mb-3 size-8 text-[var(--muted)]" /><p>Không có sân nào có tọa độ để hiển thị trên bản đồ.</p><Button className="mt-4 min-h-11" variant="outline" onPress={onShowList}>Xem danh sách</Button></div></div>}
        {mappedVenues.length > 0 && status === "error" && <Alert status="warning" className="absolute inset-x-4 top-20 z-10"><Alert.Indicator /><Alert.Content><Alert.Title>{process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? "Không tải được bản đồ." : "Thiếu cấu hình Mapbox."}</Alert.Title><Alert.Description>Danh sách sân vẫn có thể sử dụng.</Alert.Description></Alert.Content>{process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && <Button variant="outline" onPress={retry}>Thử lại</Button>}</Alert>}
        {selected && <Card data-testid="selected-venue-card" className="absolute inset-x-3 bottom-3 z-10 lg:left-auto lg:w-80"><Card.Content className="p-4"><p className="font-semibold">{selected.name}</p><p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{selected.address}</p><Link href={`/venues/${selected.id}`} className="mt-3 inline-flex min-h-11 items-center font-medium text-[var(--accent)]">Xem sân</Link></Card.Content></Card>}
      </div>
    </div>
  );
}
