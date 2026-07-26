"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import Magnifier from "@gravity-ui/icons/Magnifier";
import MapPin from "@gravity-ui/icons/MapPin";
import Star from "@gravity-ui/icons/Star";
import Xmark from "@gravity-ui/icons/Xmark";

export interface FilterValues {
  keyword: string;
  sportId: number | null;
  isOpenNow: boolean;
}

interface SportOption {
  id: number;
  name: string;
}

interface Props {
  sports: SportOption[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
  showKeyword?: boolean;
  compact?: boolean;
}

export function VenueFilterForm({
  sports,
  values,
  onApply,
  onClear,
  showKeyword = true,
  compact = false,
}: Props) {
  const [keyword, setKeyword] = useState(values.keyword);
  const [sportId, setSportId] = useState<Key | null>(
    values.sportId != null ? values.sportId : null,
  );
  const [isOpenNow, setIsOpenNow] = useState(values.isOpenNow);

  useEffect(() => {
    setKeyword(values.keyword);
    setSportId(values.sportId != null ? values.sportId : null);
    setIsOpenNow(values.isOpenNow);
  }, [values]);

  const handleApply = () => {
    onApply({
      keyword: keyword.trim(),
      sportId: sportId != null ? Number(sportId) : null,
      isOpenNow,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleApply();
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {showKeyword && (
        <TextField
          value={keyword}
          onChange={(value) => setKeyword(String(value))}
          onKeyDown={handleKeyDown}
          aria-label="Khu vực hoặc tên sân"
        >
          <Label className="search-label">Khu vực hoặc tên sân</Label>
          <div className="relative">
            <span className="search-icon-badge">
              <MapPin className="size-3.5" />
            </span>
            <Input className="search-control min-h-12 pl-11 text-[0.95rem]" placeholder="Nhập khu vực, tên sân" />
          </div>
        </TextField>
      )}

      <Select
        placeholder="Tất cả môn"
        selectedKey={sportId}
        onSelectionChange={(key) => setSportId(key)}
        aria-label="Môn chơi"
      >
        <Label className="search-label">Môn chơi</Label>
        <Select.Trigger className="search-control flex min-h-12 items-center gap-2 px-3 text-[0.95rem]">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[rgb(37_99_235_/_0.09)] text-[var(--accent)]">
            <Star className="size-3.5" />
          </span>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover className="search-popover">
          <ListBox className="p-1">
            {sports.map((sport) => (
              <ListBox.Item key={sport.id} id={sport.id} textValue={sport.name} className="search-option">
                {sport.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="flex min-h-12 items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-3">
        <div>
          <Label className="text-sm font-semibold text-[var(--foreground)]">Đang mở cửa</Label>
          <p className="text-xs text-[var(--muted)]">Chỉ hiện sân có thể đặt ngay</p>
        </div>
        <Switch
          isSelected={isOpenNow}
          onChange={setIsOpenNow}
          aria-label="Đang mở cửa"
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </div>

      <div className="grid gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-1">
        <Button variant="primary" size="sm" onPress={handleApply} className="min-h-11">
          <Magnifier className="mr-1 size-4" />
          Tìm sân
        </Button>
        <Button variant="outline" size="sm" onPress={onClear} className="min-h-11">
          <Xmark className="mr-1 size-4" />
          Xóa lọc
        </Button>
      </div>
    </div>
  );
}
