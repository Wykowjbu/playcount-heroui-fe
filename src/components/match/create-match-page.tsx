"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button, Card, Form, TextField, FieldError, Label, Input, TextArea,
  Select, ListBox, DatePicker, DateField, Calendar, TimeField,
  NumberField, Alert, Skeleton,
} from "@heroui/react";
import { type DateValue, Time, parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerGuard } from "@/lib/auth/guards";
import { createMatch } from "@/lib/api/matches";
import { getAllSports } from "@/lib/api/discovery";
import type { SportDto } from "@/lib/types/api";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import CalendarIcon from "@gravity-ui/icons/Calendar";
import type { Key } from "@heroui/react";

export function CreateMatchPage() {
  return (
    <PlayerGuard>
      <CreateMatchContent />
    </PlayerGuard>
  );
}

function CreateMatchContent() {
  const router = useRouter();

  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [sportId, setSportId] = useState<Key | null>(null);
  const [locationDesc, setLocationDesc] = useState("");
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);
  const [startTime, setStartTime] = useState<Time | null>(null);
  const [endTime, setEndTime] = useState<Time | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [skillMin, setSkillMin] = useState<Key | null>(null);
  const [skillMax, setSkillMax] = useState<Key | null>(null);
  const [costDesc, setCostDesc] = useState("");
  const [description, setDescription] = useState("");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllSports()
      .then(setSports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!sportId) e.sportId = "Vui lòng chọn môn thể thao";
    if (!selectedDate) e.date = "Vui lòng chọn ngày";
    if (!startTime) e.startTime = "Vui lòng giờ bắt đầu";
    if (!endTime) e.endTime = "Vui lòng giờ kết thúc";
    if (startTime && endTime && startTime.compare(endTime) >= 0) {
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    if (maxParticipants < 2) e.maxParticipants = "Cần ít nhất 2 người";
    if (!locationDesc.trim()) e.locationDesc = "Vui lòng nhập địa điểm";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    try {
      const pad = (n: number) => String(n).padStart(2, "0");
      const startAt = `${selectedDate!.toString()}T${pad(startTime!.hour)}:${pad(startTime!.minute)}:00`;
      const endAt = `${selectedDate!.toString()}T${pad(endTime!.hour)}:${pad(endTime!.minute)}:00`;

      const match = await createMatch({
        sportId: Number(sportId),
        locationDescription: locationDesc,
        startAt,
        endAt,
        maxParticipants,
        requiredSkillLevelMin: skillMin != null ? Number(skillMin) : undefined,
        requiredSkillLevelMax: skillMax != null ? Number(skillMax) : undefined,
        costDescription: costDesc || undefined,
        description: description || undefined,
      });

      router.push(`/matches/${match.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo kèo thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 rounded-lg mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ChevronLeft className="size-4" />
          Quay lại
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Tạo kèo đấu mới</h1>

        {error && (
          <Alert status="danger" className="mb-6">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <Card.Content className="p-5 space-y-5">
              {/* Sport */}
              <Select
                className="w-full"
                placeholder="Chọn môn thể thao"
                value={sportId}
                onChange={setSportId}
                isInvalid={!!errors.sportId}
              >
                <Label isRequired>Môn thể thao</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {sports.map((s) => (
                      <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                        {s.name}<ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {errors.sportId && <p className="text-sm text-[var(--danger)]">{errors.sportId}</p>}

              {/* Location */}
              <TextField
                className="w-full"
                isRequired
                value={locationDesc}
                onChange={setLocationDesc}
                isInvalid={!!errors.locationDesc}
              >
                <Label>Địa điểm</Label>
                <Input placeholder="VD: Sân cầu lông ABC, quận 1" />
                {errors.locationDesc && <FieldError>{errors.locationDesc}</FieldError>}
              </TextField>

              {/* Date */}
              <DatePicker
                className="w-full"
                value={selectedDate}
                onChange={setSelectedDate}
                isInvalid={!!errors.date}
                minValue={today(getLocalTimeZone())}
              >
                <Label isRequired>Ngày thi đấu</Label>
                <DateField.Group>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <CalendarIcon className="size-4" />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar aria-label="Chọn ngày">
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>
                        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>
                        {(date) => <Calendar.Cell date={date} />}
                      </Calendar.GridBody>
                    </Calendar.Grid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>
              {errors.date && <p className="text-sm text-[var(--danger)]">{errors.date}</p>}

              {/* Start/End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TimeField
                  className="w-full"
                  value={startTime}
                  onChange={setStartTime}
                  isInvalid={!!errors.startTime}
                >
                  <Label isRequired>Giờ bắt đầu</Label>
                  <TimeField.Group>
                    <TimeField.Input>
                      {(segment) => <TimeField.Segment segment={segment} />}
                    </TimeField.Input>
                  </TimeField.Group>
                </TimeField>
                {errors.startTime && <p className="text-sm text-[var(--danger)]">{errors.startTime}</p>}

                <TimeField
                  className="w-full"
                  value={endTime}
                  onChange={setEndTime}
                  isInvalid={!!errors.endTime}
                >
                  <Label isRequired>Giờ kết thúc</Label>
                  <TimeField.Group>
                    <TimeField.Input>
                      {(segment) => <TimeField.Segment segment={segment} />}
                    </TimeField.Input>
                  </TimeField.Group>
                </TimeField>
                {errors.endTime && <p className="text-sm text-[var(--danger)]">{errors.endTime}</p>}
              </div>

              {/* Max Participants */}
              <NumberField
                className="w-full"
                value={maxParticipants}
                onChange={setMaxParticipants}
                minValue={2}
                maxValue={50}
                isInvalid={!!errors.maxParticipants}
              >
                <Label isRequired>Số người tối đa</Label>
                <Input placeholder="VD: 4" />
                {errors.maxParticipants && <FieldError>{errors.maxParticipants}</FieldError>}
              </NumberField>

              {/* Skill Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  className="w-full"
                  placeholder="Tối thiểu"
                  value={skillMin}
                  onChange={setSkillMin}
                >
                  <Label>Trình độ tối thiểu</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="0" textValue="Mới chơi">Mới chơi<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="1" textValue="Trung bình">Trung bình<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="2" textValue="Nâng cao">Nâng cao<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  className="w-full"
                  placeholder="Tối đa"
                  value={skillMax}
                  onChange={setSkillMax}
                >
                  <Label>Trình độ tối đa</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="0" textValue="Mới chơi">Mới chơi<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="1" textValue="Trung bình">Trung bình<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="2" textValue="Nâng cao">Nâng cao<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {/* Cost */}
              <TextField
                className="w-full"
                value={costDesc}
                onChange={setCostDesc}
              >
                <Label>Chi phí (tuỳ chọn)</Label>
                <Input placeholder="VD: 50.000đ/người" />
              </TextField>

              {/* Description */}
              <TextArea
                className="w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              >
                <Label>Mô tả (tuỳ chọn)</Label>
              </TextArea>
            </Card.Content>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            variant="primary"
            isDisabled={submitting}
          >
            {submitting ? "Đang tạo kèo..." : "Tạo kèo đấu"}
          </Button>
        </Form>
      </main>
    </div>
  );
}
