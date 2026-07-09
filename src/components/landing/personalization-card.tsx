"use client";

import { useState } from "react";
import { Card, Button, Chip } from "@heroui/react";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Star from "@gravity-ui/icons/Star";

interface Props {
  availableSports: { id: number; name: string }[];
  onSave: (selectedSportIds: number[]) => void;
  onSkip: () => void;
}

export function PersonalizationCard({ availableSports, onSave, onSkip }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card className="border border-accent/20 bg-accent/5">
      <Card.Content className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Chọn môn bạn thường chơi để gợi ý chính xác hơn.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableSports.map((s) => (
                <Chip
                  key={s.id}
                  variant={selected.has(s.id) ? "primary" : "secondary"}
                  size="sm"
                  className="cursor-pointer select-none"
                  onClick={() => toggle(s.id)}
                >
                  {selected.has(s.id) && <CircleCheck className="w-3 h-3 mr-1" />}
                  {s.name}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="primary"
                isDisabled={selected.size === 0}
                onPress={() => onSave(Array.from(selected))}
              >
                Lưu vào hồ sơ
              </Button>
              <Button size="sm" variant="ghost" onPress={onSkip}>
                Bỏ qua
              </Button>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
