"use client";

import { useState } from "react";
import { Card, Button } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import CircleInfo from "@gravity-ui/icons/CircleInfo";
import type { LocationState } from "@/lib/types/discovery";

interface Props {
  onLocationResolved: (loc: LocationState) => void;
  onSkip: () => void;
}

export function LocationConsentCard({ onLocationResolved, onSkip }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị. Bạn có thể nhập thành phố thủ công.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocationResolved({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "geolocation",
        });
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Không thể lấy vị trí. Bạn có thể nhập thành phố thủ công.");
        } else {
          setError("Không thể lấy vị trí. Vui lòng thử lại sau.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <Card className="border border-accent/20 bg-accent/5">
      <Card.Content className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Gợi ý sân gần bạn sẽ chính xác hơn nếu có khu vực.</p>
            <p className="text-xs text-muted mt-1">
              PlayCourt dùng vị trí để sắp xếp sân gần bạn hơn.
            </p>
            {error && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                <CircleInfo className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onPress={handleUseLocation} isPending={loading}>
                <MapPin className="w-3.5 h-3.5 mr-1" />
                Dùng vị trí hiện tại
              </Button>
              <Button size="sm" variant="ghost" onPress={onSkip}>
                Bỏ qua
              </Button>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
