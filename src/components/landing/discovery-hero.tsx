"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Select,
  Label,
  ListBox,
  DatePicker,
  DateField,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import type { Key } from "@heroui/react";
import { Magnifier, MapPin } from "@gravity-ui/icons";
import { sports } from "../../mocks/sports";

interface Props {
  userName: string;
  userSports: string[];
  onSearch: (params: { location: string; sportId: string; date: string }) => void;
}

export function DiscoveryHero({ userName, userSports, onSearch }: Props) {
  const [location, setLocation] = useState("");
  const [selectedSport, setSelectedSport] = useState<Key | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);

  const firstName = userName.split(" ").slice(-1)[0] || userName;

  const handleSearch = () => {
    onSearch({
      location,
      sportId: selectedSport != null ? String(selectedSport) : "",
      date: selectedDate ? String(selectedDate) : "",
    });
  };

  return (
    <section className="relative bg-gradient-to-br from-accent via-accent/90 to-indigo-600 text-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Chào <span className="text-amber-300">{firstName}</span>, tìm sân phù hợp hôm nay
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/80 max-w-lg mx-auto">
            Đặt sân nhanh, tìm kèo dễ hơn, theo đúng môn bạn hay chơi.
          </p>
        </div>

        {/* Search bar */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card className="bg-white text-foreground shadow-xl rounded-2xl">
            <Card.Content className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Location input */}
                <div className="flex-1 flex items-center gap-2 border border-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40">
                  <MapPin className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Địa điểm..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm placeholder:text-muted"
                    aria-label="Địa điểm"
                  />
                </div>

                {/* Sport Select */}
                <Select
                  placeholder="Môn thể thao"
                  selectedKey={selectedSport}
                  onSelectionChange={(key) => setSelectedSport(key)}
                >
                  <Label className="sr-only">Môn thể thao</Label>
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

                {/* Date Picker */}
                <DatePicker value={selectedDate} onChange={setSelectedDate}>
                  <Label className="sr-only">Chọn ngày</Label>
                  <DateField.Group>
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                </DatePicker>

                {/* Search button */}
                <Button variant="primary" size="lg" className="md:px-8" onPress={handleSearch}>
                  <Magnifier className="w-4 h-4 mr-1" />
                  Tìm sân
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Quick chips */}
        {(userSports.length > 0 || true) && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {userSports.map((s) => (
              <Chip key={s} variant="primary" size="sm" className="bg-white/20 text-white hover:bg-white/30 cursor-pointer">
                {s}
              </Chip>
            ))}
            <Chip variant="primary" size="sm" className="bg-white/20 text-white hover:bg-white/30 cursor-pointer">
              <MapPin className="w-3 h-3 mr-1" />Gần tôi
            </Chip>
            <Chip variant="primary" size="sm" className="bg-white/20 text-white hover:bg-white/30 cursor-pointer">
              Tối nay
            </Chip>
          </div>
        )}
      </div>
    </section>
  );
}
