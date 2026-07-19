"use client";

import { useState } from "react";
import { Alert, Card, Button } from "@heroui/react";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Star from "@gravity-ui/icons/Star";

interface Props {
  availableSports: { id: number; name: string }[];
  onSave: (selectedSportIds: number[]) => Promise<void>;
  onSkip: () => void;
}

export function PersonalizationCard({ availableSports, onSave, onSkip }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ status: "success" | "danger"; message: string } | null>(null);

  const toggle = (id: number) => {
    setFeedback(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(Array.from(selected));
      setFeedback({ status: "success", message: "Đã lưu môn thể thao vào hồ sơ." });
    } catch (error) {
      setFeedback({
        status: "danger",
        message: error instanceof Error ? error.message : "Không thể lưu môn thể thao. Vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
    }
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
            {feedback?.status !== "success" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableSports.map((s) => (
                  <Button
                    key={s.id}
                    variant={selected.has(s.id) ? "primary" : "secondary"}
                    size="sm"
                    className="min-h-11"
                    aria-pressed={selected.has(s.id)}
                    onPress={() => toggle(s.id)}
                  >
                    {selected.has(s.id) && <CircleCheck className="w-3 h-3 mr-1" />}
                    {s.name}
                  </Button>
                ))}
              </div>
            )}
            {feedback && (
              <Alert className="mt-3" status={feedback.status}>
                <Alert.Indicator />
                <Alert.Content><Alert.Description>{feedback.message}</Alert.Description></Alert.Content>
              </Alert>
            )}
            <div className="mt-3 flex gap-2">
              {feedback?.status === "success" ? (
                <Button size="lg" variant="primary" className="min-h-11" onPress={onSkip}>Xong</Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="primary"
                    className="min-h-11"
                    isDisabled={selected.size === 0 || saving}
                    isPending={saving}
                    onPress={save}
                  >
                    {saving ? "Đang lưu..." : feedback?.status === "danger" ? "Thử lại" : "Lưu vào hồ sơ"}
                  </Button>
                  <Button size="lg" variant="ghost" className="min-h-11" onPress={onSkip} isDisabled={saving}>
                    Bỏ qua
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
