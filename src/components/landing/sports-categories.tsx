"use client";

import { Card } from "@heroui/react";
import { CircleCheck } from "@gravity-ui/icons";
import { sports } from "../../mocks/sports";

function sportGradient(sport: string): string {
  const map: Record<string, string> = {
    "Bóng đá": "from-emerald-500 to-emerald-700",
    "Quần vợt": "from-yellow-500 to-amber-600",
    "Cầu lông": "from-sky-500 to-blue-600",
    "Bóng rổ": "from-orange-500 to-red-600",
    "Bóng chuyền": "from-violet-500 to-purple-700",
    Padel: "from-pink-500 to-rose-600",
  };
  return map[sport] || "from-gray-500 to-gray-700";
}

function sportIcon(name: string, className = "w-5 h-5") {
  const map: Record<string, React.ReactNode> = {
    "Bóng đá": <CircleCheck className={className} />,
    "Quần vợt": <CircleCheck className={className} />,
    "Cầu lông": <CircleCheck className={className} />,
    "Bóng rổ": <CircleCheck className={className} />,
    "Bóng chuyền": <CircleCheck className={className} />,
    Padel: <CircleCheck className={className} />,
  };
  return map[name] || <CircleCheck className={className} />;
}

export function SportsCategories() {
  return (
    <section id="sports" className="py-12 md:py-16" style={{ background: "var(--surface-secondary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-center">
          Môn thể thao phổ biến
        </h2>
        <p className="text-muted text-center mt-2 max-w-lg mx-auto text-sm">
          Khám phá đa dạng môn thể thao và tìm sân phù hợp ngay hôm nay
        </p>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {sports.map((s) => (
            <a
              key={s.id}
              href="#courts"
              className="snap-start shrink-0 w-44 md:w-52 group"
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Card.Content className="p-0">
                  <div
                    className={`h-28 md:h-32 rounded-t-xl bg-gradient-to-br ${sportGradient(s.name)} flex items-center justify-center`}
                  >
                    <span className="text-white scale-150 opacity-80">
                      {sportIcon(s.name, "w-10 h-10")}
                    </span>
                  </div>
                  <div className="p-3 text-center">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {s.courtCount} sân
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
