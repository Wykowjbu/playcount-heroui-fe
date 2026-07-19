"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Select,
  Label,
  ListBox,
  Input,
  TextField,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";

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
    <section className="relative overflow-hidden bg-[var(--accent)] text-[var(--accent-foreground)]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Chào {firstName}, tìm sân phù hợp hôm nay
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/80 max-w-lg mx-auto">
            Đặt sân nhanh, tìm kèo dễ hơn, theo đúng môn bạn hay chơi.
          </p>
        </div>

        {/* Search bar */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card className="bg-[var(--surface)] text-[var(--foreground)] shadow-xl">
            <Card.Content className="p-4 md:p-6">
              <Form onSubmit={handleSearch} className="flex flex-col items-stretch gap-3 md:flex-row md:items-end">
                <TextField className="flex-1" value={keyword} onChange={setKeyword}>
                  <Label>Từ khóa</Label>
                  <Input
                    type="text"
                    placeholder="Tên sân hoặc địa chỉ"
                    className="min-h-11"
                  />
                </TextField>

                <Select
                  className="flex-1"
                  placeholder="Môn thể thao"
                  selectedKey={selectedSport}
                  onSelectionChange={(key) => setSelectedSport(key)}
                >
                  <Label>Môn thể thao</Label>
                  <Select.Trigger className="min-h-11">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {availableSports.map((s) => (
                        <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                          {s.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Button type="submit" variant="primary" size="lg" className="min-h-11 md:px-8">
                  <Magnifier className="w-4 h-4 mr-1" />
                  Tìm sân
                </Button>
              </Form>
            </Card.Content>
          </Card>
        </div>

        {/* Quick chips */}
        {userSports.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {userSports.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="min-h-11 border-current bg-transparent text-current"
                onPress={() => setSelectedSport(availableSports.find((sport) => sport.name === s)?.id ?? null)}
              >
                {s}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
