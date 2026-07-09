"use client";

import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Input,
  Label,
  Select,
  ListBox,
  Switch,
} from "@heroui/react";
import type { Key } from "@heroui/react";
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

  // Sync from parent when values change (e.g. URL update)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApply();
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {showKeyword && (
        <TextField
          value={keyword}
          onChange={(value) => setKeyword(String(value))}
          onKeyDown={handleKeyDown}
          aria-label="Từ khóa tìm kiếm"
        >
          <Label>Từ khóa</Label>
          <Input placeholder="Tên sân hoặc địa chỉ" />
        </TextField>
      )}

      <Select
        placeholder="Tất cả môn thể thao"
        selectedKey={sportId}
        onSelectionChange={(key) => setSportId(key)}
        aria-label="Môn thể thao"
      >
        <Label>Môn thể thao</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {sports.map((s) => (
              <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                {s.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="flex items-center justify-between">
        <Label className="text-sm">Đang mở cửa</Label>
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

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onPress={onClear} className="flex-1">
          <Xmark className="w-4 h-4 mr-1" />
          Xóa bộ lọc
        </Button>
        <Button variant="primary" size="sm" onPress={handleApply} className="flex-1">
          Áp dụng
        </Button>
      </div>
    </div>
  );
}
