"use client";

import { useState } from "react";
import { Alert, Button, Modal } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import CircleInfo from "@gravity-ui/icons/CircleInfo";
import type { LocationState } from "@/lib/types/discovery";

interface Props {
  isOpen: boolean;
  onLocationResolved: (loc: LocationState) => void;
  onSkip: () => void;
}

export function LocationConsentCard({ isOpen, onLocationResolved, onSkip }: Props) {
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

  return <Modal>
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onSkip(); }} variant="blur">
      <Modal.Container size="sm" placement="center">
        <Modal.Dialog aria-label="Cho phép dùng vị trí hiện tại">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Dùng vị trí hiện tại?</Modal.Heading></Modal.Header>
          <Modal.Body>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Gợi ý sân gần bạn sẽ chính xác hơn nếu có khu vực.</p>
            <p className="text-xs text-muted mt-1">
              PlayCourt dùng vị trí để sắp xếp sân gần bạn hơn.
            </p>
            {error && <Alert className="mt-3" status="warning"><Alert.Indicator><CircleInfo className="size-4" /></Alert.Indicator><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
          </div>
        </div>
          </Modal.Body>
          <Modal.Footer><Button slot="close" variant="tertiary">Không phải bây giờ</Button><Button variant="primary" onPress={handleUseLocation} isPending={loading}><MapPin className="mr-1 size-4" />Dùng vị trí hiện tại</Button></Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>;
}
