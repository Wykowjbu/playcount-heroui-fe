"use client";

import React from "react";

interface SportItem {
  id: number;
  name: string;
  playerCount?: number;
  courtCount?: number;
}

const DEFAULT_SPORTS: SportItem[] = [
  { id: 1, name: "Bóng đá",    courtCount: 128 },
  { id: 2, name: "Quần vợt",   courtCount: 64  },
  { id: 3, name: "Cầu lông",   courtCount: 96  },
  { id: 4, name: "Bóng rổ",    courtCount: 42  },
  { id: 5, name: "Bóng chuyền",courtCount: 35  },
  { id: 6, name: "Padel",      courtCount: 18  },
];

/* ── Sport accent colour ────────────────────────────────────────── */
function sportColor(sport: string): { bg: string; light: string } {
  const map: Record<string, { bg: string; light: string }> = {
    "Bóng đá":     { bg: "#10b981", light: "rgba(16,185,129,0.10)" },
    "Quần vợt":    { bg: "#f59e0b", light: "rgba(245,158,11,0.10)" },
    "Cầu lông":    { bg: "#1d6ef5", light: "rgba(29,110,245,0.10)" },
    "Bóng rổ":     { bg: "#f97316", light: "rgba(249,115,22,0.10)" },
    "Bóng chuyền": { bg: "#8b5cf6", light: "rgba(139,92,246,0.10)" },
    "Padel":       { bg: "#ec4899", light: "rgba(236,72,153,0.10)" },
  };
  return map[sport] ?? { bg: "#64748b", light: "rgba(100,116,139,0.10)" };
}

/* ── Sport SVG emoji ────────────────────────────────────────────── */
function SportEmoji({ name }: { name: string }) {
  const map: Record<string, string> = {
    "Bóng đá": "⚽",
    "Quần vợt": "🎾",
    "Cầu lông": "🏸",
    "Bóng rổ": "🏀",
    "Bóng chuyền": "🏐",
    "Padel": "🏓",
  };
  return (
    <span className="text-3xl leading-none select-none" aria-hidden>
      {map[name] ?? "🏅"}
    </span>
  );
}

export function SportsCategories({ sports = DEFAULT_SPORTS }: { sports?: SportItem[] }) {
  return (
    <section id="sports" className="py-14 md:py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section header ───────────────────────────────────── */}
        <div className="text-center mb-10">
          <span className="section-label mb-3 inline-flex">
            Danh mục thể thao
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mt-3">
            Môn thể thao phổ biến
          </h2>
          <p className="text-muted text-sm md:text-base mt-2 max-w-md mx-auto">
            Khám phá đa dạng môn thể thao và tìm sân phù hợp ngay hôm nay
          </p>
        </div>

        {/* ── Cards grid ──────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
          {sports.map((s) => {
            const color = sportColor(s.name);
            return (
              <a
                key={s.id}
                href="#courts"
                className="snap-start shrink-0 w-36 sm:w-auto group block"
              >
                <div
                  className="sport-chip flex-col h-full"
                  style={{ minHeight: "7rem" }}
                >
                  {/* Icon circle */}
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-2xl mb-2 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: color.light }}
                  >
                    <SportEmoji name={s.name} />
                  </div>

                  {/* Label */}
                  <p className="text-sm font-semibold text-foreground leading-tight text-center">
                    {s.name}
                  </p>

                  {/* Count */}
                  <p
                    className="text-xs font-medium mt-0.5"
                    style={{ color: color.bg }}
                  >
                    {s.courtCount} sân
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
