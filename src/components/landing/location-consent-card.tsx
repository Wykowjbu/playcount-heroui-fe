"use client";

import { useRef, useState } from "react";
import { Alert, Button, Modal } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import CircleInfo from "@gravity-ui/icons/CircleInfo";
import type { LocationState } from "@/lib/types/discovery";

interface Props {
  isOpen: boolean;
  onLocationResolved: (loc: LocationState) => Promise<void>;
  onSkip: () => void;
}

export function LocationConsentCard({ isOpen, onLocationResolved, onSkip }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef(0);

  const dismiss = () => {
    attemptRef.current += 1;
    setLoading(false);
    onSkip();
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị. Bạn vẫn có thể xem các sân phổ biến.");
      return;
    }
    setLoading(true);
    setError(null);
    const attempt = ++attemptRef.current;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (attempt !== attemptRef.current) return;
        try {
          await onLocationResolved({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "geolocation",
          });
        } catch {
          if (attempt === attemptRef.current) setError("Không thể tải gợi ý theo vị trí. Vui lòng thử lại.");
        } finally {
          if (attempt === attemptRef.current) setLoading(false);
        }
      },
      (err) => {
        if (attempt !== attemptRef.current) return;
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Trình duyệt đã từ chối quyền vị trí. Hãy cấp quyền rồi thử lại.");
        } else {
          setError("Không thể lấy vị trí. Vui lòng thử lại sau.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Dùng vị trí hiện tại?</h3>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted hover:text-foreground text-xl font-medium p-1 leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-foreground">Gợi ý sân gần bạn sẽ chính xác hơn nếu có vị trí khu vực.</p>
          <p className="text-xs text-muted">
            PlayCourt dùng vị trí để tìm kiếm và sắp xếp các sân thể thao ở gần bạn nhất.
          </p>
          {error && (
            <Alert status="warning" className="mt-3">
              <Alert.Indicator><CircleInfo className="size-4" /></Alert.Indicator>
              <Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content>
            </Alert>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="tertiary" size="lg" className="min-h-11 flex-1" onPress={dismiss}>
            Không phải bây giờ
          </Button>
          <Button variant="primary" size="lg" className="min-h-11 flex-1" onPress={handleUseLocation} isPending={loading}>
            <MapPin className="mr-1 size-4" />
            {error ? "Thử lại" : "Dùng vị trí hiện tại"}
          </Button>
        </div>
      </div>
    </div>
  );
}
