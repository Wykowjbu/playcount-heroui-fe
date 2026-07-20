"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button, Card, Form, TextField, FieldError, Label, Input, TextArea,
  Select, ListBox, DatePicker, DateField, Calendar, TimeField,
  NumberField, Skeleton,
} from "@heroui/react";
import { type DateValue, Time, parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerGuard } from "@/lib/auth/guards";
import { createMatch, updateMatch, getMatchById } from "@/lib/api/matches";
import { getAllSports } from "@/lib/api/discovery";
import type { SportDto } from "@/lib/types/api";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import CalendarIcon from "@gravity-ui/icons/Calendar";
import type { Key } from "@heroui/react";
import { VenueMapPicker } from "./venue-map-picker";
import { toLocalIsoAtWallTime } from "@/lib/utils/player-flow";

export function CreateMatchPage({ matchId, embedded = false, onSubmittingChange }: { matchId?: number; embedded?: boolean; onSubmittingChange?: (submitting: boolean) => void }) {
  return (
    <PlayerGuard>
      <CreateMatchContent matchId={matchId} embedded={embedded} onSubmittingChange={onSubmittingChange} />
    </PlayerGuard>
  );
}

function CreateMatchContent({ matchId, embedded, onSubmittingChange }: { matchId?: number; embedded: boolean; onSubmittingChange?: (submitting: boolean) => void }) {
  const router = useRouter();
  const isEdit = matchId != null;

  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Form state
  const [sportId, setSportId] = useState<Key | null>(null);
  const [locationDesc, setLocationDesc] = useState("");
  const [courtId, setCourtId] = useState<number | null>(null);
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
  const formId = embedded ? "create-match-form" : "create-match-page-form";

  const handleSportChange = (nextSportId: Key | null) => {
    setCourtId(null);
    setLocationDesc("");
    setSelectedDate(null);
    setStartTime(null);
    setEndTime(null);
    setErrors((current) => {
      const next = { ...current };
      for (const field of ["sportId", "locationDesc", "date", "startTime", "endTime"]) delete next[field];
      return next;
    });
    setSportId(nextSportId);
  };

  useEffect(() => {
    setMounted(true);
    Promise.all([
      getAllSports(),
      isEdit ? getMatchById(matchId!) : Promise.resolve(null),
    ])
      .then(([sportsData, match]) => {
        setSports(sportsData);
        if (match) {
          setSportId(match.sportId);
          setLocationDesc(match.locationDescription ?? "");
          setCourtId(match.courtId);
          setSelectedDate(parseDate(match.startAt.slice(0, 10)));
          setStartTime(new Time(Number(match.startAt.slice(11, 13)), Number(match.startAt.slice(14, 16))));
          setEndTime(new Time(Number(match.endAt.slice(11, 13)), Number(match.endAt.slice(14, 16))));
          setMaxParticipants(match.maxParticipants);
          setSkillMin(match.requiredSkillLevelMin != null ? String(match.requiredSkillLevelMin) : null);
          setSkillMax(match.requiredSkillLevelMax != null ? String(match.requiredSkillLevelMax) : null);
          setCostDesc(match.costDescription ?? "");
          setDescription(match.description ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isEdit, matchId]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!sportId) e.sportId = "Vui lòng chọn môn thể thao";
    if (!selectedDate) e.date = "Vui lòng chọn ngày";
    if (!startTime) e.startTime = "Vui lòng giờ bắt đầu";
    if (!endTime) e.endTime = "Vui lòng giờ kết thúc";
    if (startTime && endTime && startTime.compare(endTime) >= 0) {
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    if (maxParticipants < 2 || maxParticipants > 100) e.maxParticipants = "Số người phải từ 2 đến 100";
    if (!courtId && !locationDesc.trim()) e.locationDesc = "Vui lòng nhập địa điểm";
    if (skillMin != null && skillMax != null && Number(skillMin) > Number(skillMax)) {
      e.skillMax = "Trình độ tối đa phải bằng hoặc cao hơn trình độ tối thiểu";
    }
    if (selectedDate && startTime) {
      try {
        const startAt = toLocalIsoAtWallTime(selectedDate.toString(), `${String(startTime.hour).padStart(2, "0")}:${String(startTime.minute).padStart(2, "0")}`);
        if (Date.parse(startAt) <= Date.now()) e.startTime = "Thời gian bắt đầu phải ở tương lai";
      } catch {
        e.startTime = "Giờ bắt đầu không tồn tại trong múi giờ hiện tại";
      }
    }
    if (selectedDate && endTime) {
      try {
        toLocalIsoAtWallTime(selectedDate.toString(), `${String(endTime.hour).padStart(2, "0")}:${String(endTime.minute).padStart(2, "0")}`);
      } catch {
        e.endTime = "Giờ kết thúc không tồn tại trong múi giờ hiện tại";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const time = (value: Time) => `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
      const startAt = toLocalIsoAtWallTime(selectedDate!.toString(), time(startTime!));
      const endAt = toLocalIsoAtWallTime(selectedDate!.toString(), time(endTime!));

      if (isEdit) {
        await updateMatch(matchId!, {
          locationDescription: locationDesc,
          startAt,
          endAt,
          maxParticipants,
          requiredSkillLevelMin: skillMin != null ? Number(skillMin) : undefined,
          requiredSkillLevelMax: skillMax != null ? Number(skillMax) : undefined,
          costDescription: costDesc || undefined,
          description: description || undefined,
        });
        router.push(`/matches/${matchId}`);
      } else {
        const match = await createMatch({
          sportId: Number(sportId),
          courtId: courtId ?? undefined,
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
      }
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div className={embedded ? "p-6" : "min-h-screen bg-[var(--background)]"}>
        {!embedded && <SiteHeader />}
        <main className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 rounded-lg mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-[var(--background)]"}>
      {!embedded && <SiteHeader />}
      <main className={embedded ? "px-0 py-6" : "mx-auto max-w-2xl px-4 pt-6 pb-24 sm:px-6 lg:px-8"}>
        {!embedded && <Link
          href="/matches"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ChevronLeft className="size-4" />
          Quay lại
        </Link>}

        {!embedded && <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">{isEdit ? "Chỉnh sửa kèo đấu" : "Tạo kèo đấu mới"}</h1>}

        <Form id={formId} validationBehavior="aria" onSubmit={handleSubmit} className="space-y-6">
          <Card variant={embedded ? "transparent" : "default"}>
            <Card.Content className={embedded ? "space-y-5 p-0" : "space-y-5 p-5"}>
              {/* Sport */}
              <Select
                className="w-full"
                placeholder="Chọn môn thể thao"
                value={sportId}
                onChange={handleSportChange}
                isInvalid={!!errors.sportId}
                isDisabled={isEdit}
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
                {errors.sportId && <FieldError>{errors.sportId}</FieldError>}
              </Select>

              {/* Location */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
                <VenueMapPicker
                  className="w-full sm:w-auto"
                  sportId={sportId != null ? Number(sportId) : null}
                  onSelect={({ courtId: nextCourtId, locationDescription, startAt, endAt }) => {
                    setCourtId(nextCourtId);
                    setLocationDesc(locationDescription);
                    setSelectedDate(parseDate(startAt.slice(0, 10)));
                    setStartTime(new Time(Number(startAt.slice(11, 13)), Number(startAt.slice(14, 16))));
                    setEndTime(new Time(Number(endAt.slice(11, 13)), Number(endAt.slice(14, 16))));
                  }}
                />
              </div>

              {courtId && selectedDate && startTime && endTime ? <Card variant="secondary">
                <Card.Content className="flex items-center justify-between gap-4 p-4">
                  <div><p className="font-medium">Sân và thời gian đã chọn</p><p className="mt-1 text-sm text-[var(--muted)]">{locationDesc}</p><p className="text-sm text-[var(--muted)]">{selectedDate.toString()} · {String(startTime.hour).padStart(2, "0")}:{String(startTime.minute).padStart(2, "0")}–{String(endTime.hour).padStart(2, "0")}:{String(endTime.minute).padStart(2, "0")}</p></div>
                  <Button variant="outline" onPress={() => setCourtId(null)}>Đổi sân/giờ</Button>
                </Card.Content>
              </Card> : <><DatePicker
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
                {errors.date && <FieldError>{errors.date}</FieldError>}
              </DatePicker>

              {/* Start/End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TimeField
                  className="w-full"
                  value={startTime}
                  onChange={setStartTime}
                  isInvalid={!!errors.startTime}
                  hourCycle={24}
                >
                  <Label isRequired>Giờ bắt đầu</Label>
                  <TimeField.Group>
                    <TimeField.Input>
                      {(segment) => <TimeField.Segment segment={segment} />}
                    </TimeField.Input>
                  </TimeField.Group>
                  {errors.startTime && <FieldError>{errors.startTime}</FieldError>}
                </TimeField>

                <TimeField
                  className="w-full"
                  value={endTime}
                  onChange={setEndTime}
                  isInvalid={!!errors.endTime}
                  hourCycle={24}
                >
                  <Label isRequired>Giờ kết thúc</Label>
                  <TimeField.Group>
                    <TimeField.Input>
                      {(segment) => <TimeField.Segment segment={segment} />}
                    </TimeField.Input>
                  </TimeField.Group>
                  {errors.endTime && <FieldError>{errors.endTime}</FieldError>}
                </TimeField>
              </div></>}

              {/* Max Participants */}
              <NumberField
                className="w-full"
                value={maxParticipants}
                onChange={setMaxParticipants}
                minValue={2}
                maxValue={100}
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
                  isInvalid={!!errors.skillMax}
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
                  {errors.skillMax && <FieldError>{errors.skillMax}</FieldError>}
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
              <TextField className="w-full" value={description} onChange={setDescription}>
                <Label>Mô tả (tuỳ chọn)</Label>
                <TextArea rows={3} />
              </TextField>
            </Card.Content>
          </Card>

          {/* Submit */}
          {!embedded && <Button
            type="submit"
            className="w-full"
            size="lg"
            variant="primary"
            isDisabled={submitting}
          >
            {submitting ? (isEdit ? "Đang lưu..." : "Đang tạo kèo...") : (isEdit ? "Lưu thay đổi" : "Tạo kèo đấu")}
          </Button>}
        </Form>
      </main>
    </div>
  );
}
