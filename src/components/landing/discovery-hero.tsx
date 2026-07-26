"use client";

import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import Magnifier from "@gravity-ui/icons/Magnifier";

interface SportOption {
  id: number;
  name: string;
}

interface Props {
  userName: string;
  userSports: string[];
  availableSports?: SportOption[];
  onSearch: (params: { keyword: string; sportId: string }) => void;
}

export function DiscoveryHero({ userName, userSports, availableSports = [], onSearch }: Props) {
  const [keyword, setKeyword] = useState("");
  const [selectedSport, setSelectedSport] = useState<Key | null>(null);

  const firstName = userName.split(" ").slice(-1)[0] || userName;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch({
      keyword: keyword.trim(),
      sportId: selectedSport != null ? String(selectedSport) : "",
    });
  };

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[linear-gradient(135deg,#ffffff_0%,#f0f7ff_48%,#f7faf6_100%)]">
      <div className="court-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            PlayCourt
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
            Chào {firstName}, tìm sân phù hợp hôm nay
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">
            Tìm theo khu vực, chọn môn chơi và vào danh sách sân còn lịch trống.
          </p>
        </div>

        <div className="search-dock mt-7 max-w-5xl rounded-3xl p-3">
          <Form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1.2fr_240px_auto] md:items-end">
            <TextField value={keyword} onChange={setKeyword} aria-label="Khu vực hoặc tên sân">
              <Label className="search-label">Khu vực hoặc tên sân</Label>
              <Input
                type="text"
                placeholder="Nhập quận, thành phố, tên sân"
                className="search-control min-h-12"
              />
            </TextField>

            <Select
              placeholder="Tất cả môn"
              selectedKey={selectedSport}
              onSelectionChange={(key) => setSelectedSport(key)}
              aria-label="Môn chơi"
            >
              <Label className="search-label">Môn chơi</Label>
              <Select.Trigger className="search-control min-h-12">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {availableSports.map((sport) => (
                    <ListBox.Item key={sport.id} id={sport.id} textValue={sport.name}>
                      {sport.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Button type="submit" variant="primary" size="lg" className="min-h-12 rounded-2xl md:px-8">
              <Magnifier className="mr-1 size-4" />
              Tìm sân
            </Button>
          </Form>
        </div>

        {userSports.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {userSports.map((sportName) => (
              <Button
                key={sportName}
                size="sm"
                variant="outline"
                className="min-h-11 border-[var(--border)] bg-white text-[var(--foreground)]"
                onPress={() => setSelectedSport(availableSports.find((sport) => sport.name === sportName)?.id ?? null)}
              >
                {sportName}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
