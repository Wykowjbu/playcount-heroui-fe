"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import Magnifier from "@gravity-ui/icons/Magnifier";
import Star from "@gravity-ui/icons/Star";
import Calendar from "@gravity-ui/icons/Calendar";
import Clock from "@gravity-ui/icons/Clock";

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
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-br from-white via-blue-50/40 to-slate-50 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="court-grid pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:pt-4">
          {/* ── Left content ───────────────────────────────────── */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft" className="border border-[var(--border)] bg-white text-[var(--accent)] font-semibold">
                ⚽ Chào mừng trở lại
              </Chip>
              <Chip size="sm" variant="soft" className="border border-[var(--border)] bg-white text-[var(--foreground)]">
                Lịch đặt khả dụng
              </Chip>
            </div>

            <h1 className="hero-title font-display text-4xl font-black leading-[1.05] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Chào {firstName},<br />
              <span className="text-[var(--accent)]">Sẵn sàng ra sân hôm nay?</span>
            </h1>

            <p className="mt-3 max-w-xl text-base text-[var(--muted)] leading-relaxed">
              Chọn môn chơi yêu thích, lọc theo khu vực và đặt sân trực tuyến ngay tức thì.
            </p>

            {/* ── Search dock ───────────────────────────────── */}
            <div className="search-dock mt-6 max-w-3xl rounded-[1.5rem] p-2.5">
              <Form onSubmit={handleSearch} className="grid gap-2.5 lg:grid-cols-[1.2fr_200px_auto] lg:items-end">
                <TextField aria-label="Khu vực hoặc tên sân">
                  <Label className="search-label">Khu vực hoặc tên sân</Label>
                  <div className="relative">
                    <span className="search-icon-badge">
                      <MapPin className="size-3.5" />
                    </span>
                    <Input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Nhập quận, tên sân..."
                      className="search-control min-h-12 pl-11 text-[0.95rem]"
                    />
                  </div>
                </TextField>

                <Select
                  placeholder="Tất cả môn"
                  selectedKey={selectedSport}
                  onSelectionChange={(key) => setSelectedSport(key)}
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
                      {availableSports.map((sport) => (
                        <ListBox.Item key={sport.id} id={sport.id} textValue={sport.name} className="search-option">
                          {sport.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-[0.875rem] bg-[var(--accent)] px-6 text-white font-semibold shadow-md shadow-blue-900/20 transition hover:-translate-y-0.5"
                >
                  <Magnifier className="size-4 shrink-0" />
                  <span>Tìm sân</span>
                </Button>
              </Form>
            </div>

            {/* ── Quick sport selection ──────────────────────── */}
            {userSports.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted mr-1">Môn ưa thích:</span>
                {userSports.map((sportName) => (
                  <button
                    key={sportName}
                    type="button"
                    onClick={() =>
                      setSelectedSport(availableSports.find((s) => s.name === sportName)?.id ?? null)
                    }
                    className="min-h-9 cursor-pointer rounded-full border border-[var(--border)] bg-white px-3.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] shadow-xs"
                  >
                    {sportName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right side athletic widget ────────────────────── */}
          <div className="hidden lg:block">
            <div className="athletic-card relative overflow-hidden rounded-[24px] p-5 shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--accent)] via-sky-400 to-emerald-400" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="brand-mark h-8 w-8 rounded-xl">
                    <span className="brand-mark__monogram text-[0.62rem]">PC</span>
                  </div>
                  <span className="font-display font-extrabold text-foreground">PlayCourt</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trực tuyến
                </span>
              </div>

              <div className="space-y-3 my-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>Lịch đặt tiếp theo</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">Xem ngay</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Đặt sân trong 30s</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">Nhanh chóng</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-slate-100">
                <div className="p-2">
                  <p className="font-display text-xl font-bold text-foreground">20+</p>
                  <p className="text-[10px] font-semibold text-muted uppercase">Môn chơi</p>
                </div>
                <div className="p-2">
                  <p className="font-display text-xl font-bold text-foreground">500+</p>
                  <p className="text-[10px] font-semibold text-muted uppercase">Sân bãi</p>
                </div>
                <div className="p-2">
                  <p className="font-display text-xl font-bold text-accent">24/7</p>
                  <p className="text-[10px] font-semibold text-muted uppercase">Hỗ trợ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Running Marquee Ticker Banner ─────────────────────── */}
      <section className="overflow-hidden border-y border-slate-800 bg-[#0f172a] py-3.5 text-white">
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {[0, 1].map((group) => (
            <div key={group} className="flex items-center shrink-0">
              {["BADMINTON", "PICKLEBALL", "TENNIS", "BOOK FAST", "JOIN MATCHES", "PLAY TONIGHT"].map((item) => (
                <span key={`${group}-${item}`} className="font-display text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300 flex items-center px-6 gap-6">
                  {item}
                  <span className="size-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
