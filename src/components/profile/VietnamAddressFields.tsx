"use client";

import { useEffect, useRef, useState } from "react";
import type { Key } from "@heroui/react";
import {
  Button,
  ComboBox,
  Description,
  FieldError,
  Input,
  Label,
  Link,
  ListBox,
  TextField,
  toast,
} from "@heroui/react";
import LocationArrow from "@gravity-ui/icons/LocationArrow";

const PROVINCES_API = "https://provinces.open-api.vn/api/v2/p/";
const NOMINATIM_API = "https://nominatim.openstreetmap.org/reverse";

interface AdministrativeUnit {
  code: number;
  name: string;
}

interface Province extends AdministrativeUnit {
  wards?: Ward[];
}

interface Ward extends AdministrativeUnit {
  province_code: number;
}

interface AddressValue {
  address: string;
  province: string;
  fullAddress: string;
}

interface Props {
  address: string;
  province?: string;
  isRequired?: boolean;
  onChange: (value: AddressValue) => void;
}

interface ReverseGeocodeResult {
  name?: string;
  address?: Record<string, string | undefined>;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\b(tinh|thanh pho|phuong|xa|dac khu)\b/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function findUnit<T extends AdministrativeUnit>(units: T[], candidates: Array<string | undefined>) {
  const normalizedCandidates = candidates.filter(Boolean).map((value) => normalize(value!));
  return units.find((unit) => {
    const name = normalize(unit.name);
    return normalizedCandidates.some((candidate) => name === candidate || name.includes(candidate) || candidate.includes(name));
  });
}

function joinAddress(detail: string, ward?: Ward, province?: Province) {
  return [detail.trim(), ward?.name, province?.name, "Việt Nam"].filter(Boolean).join(", ");
}

function removeAddressSuffix(address: string, values: Array<string | undefined>) {
  const suffixes = new Set(values.filter(Boolean).map((value) => normalize(value!)));
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  while (parts.length > 0 && suffixes.has(normalize(parts.at(-1)!))) parts.pop();
  return parts.join(", ");
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Trình duyệt không hỗ trợ xác định vị trí."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 300_000,
      timeout: 15_000,
    });
  });
}

async function loadProvince(code: number) {
  const response = await fetch(`${PROVINCES_API}${code}?depth=2`);
  if (!response.ok) throw new Error("Không thể tải danh sách xã/phường.");
  return response.json() as Promise<Province>;
}

export function VietnamAddressFields({ address, province = "", isRequired, onChange }: Props) {
  const [initialAddress] = useState(address);
  const [initialProvince] = useState(province);
  const hydratedWard = useRef(false);
  const [detail, setDetail] = useState(address);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [provinceKey, setProvinceKey] = useState<Key | null>(null);
  const [wardKey, setWardKey] = useState<Key | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(PROVINCES_API)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Province[]>;
      })
      .then((items) => {
        if (!active) return;
        setProvinces(items);
        const selected = findUnit(items, [initialProvince, initialAddress]);
        if (selected) setProvinceKey(selected.code);
      })
      .catch(() => {
        if (active) toast.danger("Không thể tải danh sách địa chỉ", { description: "Bạn vẫn có thể nhập phần địa chỉ chi tiết." });
      })
      .finally(() => {
        if (active) setLoadingProvinces(false);
      });
    return () => { active = false; };
  }, [initialAddress, initialProvince]);

  useEffect(() => {
    if (provinceKey == null) {
      setWards([]);
      return;
    }

    let active = true;
    setLoadingWards(true);
    loadProvince(Number(provinceKey))
      .then((selected) => {
        if (!active) return;
        const items = selected.wards ?? [];
        setWards(items);
        if (!hydratedWard.current) {
          const initialWard = findUnit(items, [initialAddress]);
          if (initialWard) setWardKey(initialWard.code);
          setDetail(removeAddressSuffix(initialAddress, [initialWard?.name, selected.name, "Việt Nam", "Vietnam"]));
          hydratedWard.current = true;
        }
      })
      .catch(() => {
        if (active) toast.danger("Không thể tải danh sách xã/phường");
      })
      .finally(() => {
        if (active) setLoadingWards(false);
      });
    return () => { active = false; };
  }, [initialAddress, provinceKey]);

  function emit(nextDetail: string, nextProvinceKey = provinceKey, nextWardKey = wardKey, availableWards = wards) {
    const selectedProvince = provinces.find((item) => item.code === Number(nextProvinceKey));
    const selectedWard = availableWards.find((item) => item.code === Number(nextWardKey));
    const compactAddress = [nextDetail.trim(), selectedWard?.name].filter(Boolean).join(", ");
    onChange({
      address: compactAddress,
      province: selectedProvince?.name ?? "",
      fullAddress: joinAddress(nextDetail, selectedWard, selectedProvince),
    });
  }

  async function handleCurrentLocation() {
    setLocating(true);
    const locationRequest = (async () => {
      const position = await getCurrentPosition();
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
        addressdetails: "1",
        "accept-language": "vi",
        countrycodes: "vn",
      });
      const response = await fetch(`${NOMINATIM_API}?${params}`);
      if (!response.ok) throw new Error("Không thể đổi vị trí thành địa chỉ.");
      const result = await response.json() as ReverseGeocodeResult;
      const values = result.address ?? {};
      const selectedProvince = findUnit(provinces, [values.state, values.city, values.province]);
      if (!selectedProvince) throw new Error("Không xác định được tỉnh/thành phố tại vị trí này.");

      const selectedProvinceWithWards = await loadProvince(selectedProvince.code);
      const nextWards = selectedProvinceWithWards.wards ?? [];
      const selectedWard = findUnit(nextWards, [
        values.suburb,
        values.city_district,
        values.municipality,
        values.town,
        values.village,
        values.quarter,
        values.neighbourhood,
      ]);
      const nextDetail = [values.house_number, values.road].filter(Boolean).join(" ") || result.name || "";

      hydratedWard.current = true;
      setProvinceKey(selectedProvince.code);
      setWards(nextWards);
      setWardKey(selectedWard?.code ?? null);
      setDetail(nextDetail);
      emit(nextDetail, selectedProvince.code, selectedWard?.code ?? null, nextWards);
    })();

    toast.promise(locationRequest, {
      loading: "Đang xác định vị trí hiện tại…",
      success: "Đã điền địa chỉ gần vị trí hiện tại. Vui lòng kiểm tra lại.",
      error: (error) => {
        const denied = typeof error === "object" && error !== null && "code" in error && Number(error.code) === 1;
        if (denied) return "Bạn chưa cho phép truy cập vị trí. Hãy chọn địa chỉ thủ công.";
        return error instanceof Error ? error.message : "Không thể xác định địa chỉ. Vui lòng chọn thủ công.";
      },
    });

    try {
      await locationRequest;
    } catch {
      // toast.promise handles the error message.
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Địa chỉ{isRequired ? " *" : ""}</p>
          <p className="text-xs text-[var(--muted)]">Chọn theo đơn vị hành chính Việt Nam hiện hành.</p>
        </div>
        <Button type="button" size="sm" variant="tertiary" isPending={locating} isDisabled={loadingProvinces} onPress={() => void handleCurrentLocation()}>
          <LocationArrow className="size-4" />
          {locating ? "Đang xác định…" : "Dùng vị trí hiện tại"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ComboBox
          fullWidth
          isRequired={isRequired}
          isDisabled={loadingProvinces}
          selectedKey={provinceKey}
          defaultFilter={(text, inputValue) => normalize(text).includes(normalize(inputValue))}
          onSelectionChange={(key) => {
            hydratedWard.current = true;
            setProvinceKey(key);
            setWardKey(null);
            setWards([]);
            emit(detail, key, null, []);
          }}
        >
          <Label>Tỉnh/Thành phố</Label>
          <ComboBox.InputGroup>
            <Input placeholder={loadingProvinces ? "Đang tải…" : "Tìm hoặc chọn tỉnh/thành"} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>
              {provinces.map((item) => (
                <ListBox.Item key={item.code} id={item.code} textValue={item.name}>
                  {item.name}<ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
          <FieldError />
        </ComboBox>

        <ComboBox
          fullWidth
          isRequired={isRequired}
          isDisabled={provinceKey == null || loadingWards}
          selectedKey={wardKey}
          defaultFilter={(text, inputValue) => normalize(text).includes(normalize(inputValue))}
          onSelectionChange={(key) => {
            setWardKey(key);
            emit(detail, provinceKey, key);
          }}
        >
          <Label>Xã/Phường/Đặc khu</Label>
          <ComboBox.InputGroup>
            <Input placeholder={loadingWards ? "Đang tải…" : provinceKey == null ? "Chọn tỉnh/thành trước" : "Tìm hoặc chọn xã/phường"} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>
              {wards.map((item) => (
                <ListBox.Item key={item.code} id={item.code} textValue={item.name}>
                  {item.name}<ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
          <FieldError />
        </ComboBox>
      </div>

      <TextField isRequired={isRequired} value={detail} onChange={(value) => { setDetail(value); emit(value); }}>
        <Label>Số nhà, tên đường, thôn/ấp</Label>
        <Input placeholder="VD: 120 đường 2 Tháng 9" />
        <Description>
          Quốc gia: Việt Nam · Dữ liệu vị trí © <Link href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</Link>
        </Description>
        <FieldError />
      </TextField>
    </div>
  );
}
