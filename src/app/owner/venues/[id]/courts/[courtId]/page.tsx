"use client";

import { use, useEffect, useState } from "react";
import { Alert, Button, Card, FieldError, Form, Input, Label, ListBox, Select, Spinner, Tab, TabList, TabPanel, Tabs, TextField } from "@heroui/react";
import TrashBin from "@gravity-ui/icons/TrashBin";
import {
  createCourtSchedule, createPricingRule, deleteCourtSchedule, deletePricingRule,
  getCourt, getCourtSchedules, getPricingRules, updateCourt,
} from "@/lib/api/owner";
import { getAllSports } from "@/lib/api/discovery";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import type { CourtDto, CourtScheduleDto, PricingRuleDto, SportDto } from "@/lib/types/api";
import { formatDateTime, formatVnd } from "@/lib/utils/format";

export default function CourtManagementPage({ params }: { params: Promise<{ id: string; courtId: string }> }) {
  const { courtId } = use(params);
  return <OwnerGuard><OwnerShell activeItem="venues"><CourtManager courtId={Number(courtId)} /></OwnerShell></OwnerGuard>;
}

function CourtManager({ courtId }: { courtId: number }) {
  const [court, setCourt] = useState<CourtDto | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [rules, setRules] = useState<PricingRuleDto[]>([]);
  const [schedules, setSchedules] = useState<CourtScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [courtData, sportData, ruleData, scheduleData] = await Promise.all([getCourt(courtId), getAllSports(), getPricingRules(courtId), getCourtSchedules(courtId)]);
      setCourt(courtData); setSports(sportData); setRules(ruleData); setSchedules(scheduleData);
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể tải sân"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [courtId]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!court) return <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error || "Không tìm thấy sân"}</Alert.Description></Alert.Content></Alert>;

  async function saveCourt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { await updateCourt(courtId, { name: String(data.get("name")), sportId: Number(data.get("sportId")), indoor: data.get("indoor") === "true", status: String(data.get("status")) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể lưu sân"); }
  }

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { await createPricingRule(courtId, { dayOfWeek: Number(data.get("dayOfWeek")), startTime: String(data.get("startTime")), endTime: String(data.get("endTime")), pricePerHour: Number(data.get("pricePerHour")), effectiveFrom: String(data.get("effectiveFrom")), effectiveTo: String(data.get("effectiveTo")) || undefined }); event.currentTarget.reset(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể thêm bảng giá"); }
  }

  async function addSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { await createCourtSchedule(courtId, { startAt: new Date(String(data.get("startAt"))).toISOString(), endAt: new Date(String(data.get("endAt"))).toISOString(), reason: String(data.get("reason")) || undefined }); event.currentTarget.reset(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể thêm lịch đóng sân"); }
  }

  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">{court.name}</h1><p className="text-sm text-muted">Quản lý thông tin, giá và lịch đóng sân.</p></div>{error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    <Tabs><TabList><Tab id="info">Thông tin</Tab><Tab id="pricing">Bảng giá</Tab><Tab id="schedule">Lịch đóng sân</Tab></TabList>
      <TabPanel id="info"><Card><Card.Content className="p-5"><Form className="grid gap-4 md:grid-cols-2" onSubmit={saveCourt}><TextField isRequired name="name" defaultValue={court.name}><Label>Tên sân</Label><Input /><FieldError /></TextField><SimpleSelect name="sportId" label="Môn thể thao" defaultValue={String(court.sportId)} items={sports.map((s) => [String(s.id), s.name])} /><SimpleSelect name="indoor" label="Loại sân" defaultValue={String(court.indoor)} items={[["true","Trong nhà"],["false","Ngoài trời"]]} /><SimpleSelect name="status" label="Trạng thái" defaultValue={court.status} items={[["Available","Hoạt động"],["Maintenance","Bảo trì"],["Inactive","Ngưng hoạt động"]]} /><Button type="submit" className="md:col-span-2">Lưu thay đổi</Button></Form></Card.Content></Card></TabPanel>
      <TabPanel id="pricing"><div className="space-y-4"><Card><Card.Content className="p-5"><Form className="grid gap-4 md:grid-cols-3" onSubmit={addRule}><SimpleSelect name="dayOfWeek" label="Thứ" defaultValue="1" items={[["1","Thứ 2"],["2","Thứ 3"],["3","Thứ 4"],["4","Thứ 5"],["5","Thứ 6"],["6","Thứ 7"],["7","Chủ nhật"]]} /><MiniField name="startTime" label="Bắt đầu" type="time" /><MiniField name="endTime" label="Kết thúc" type="time" /><MiniField name="pricePerHour" label="Giá/giờ" type="number" /><MiniField name="effectiveFrom" label="Hiệu lực từ" type="date" /><MiniField name="effectiveTo" label="Đến ngày" type="date" required={false} /><Button type="submit" className="md:col-span-3">Thêm khung giá</Button></Form></Card.Content></Card>{rules.map((r) => <Card key={r.id}><Card.Content className="flex items-center justify-between p-4"><span>Thứ {r.dayOfWeek} · {r.startTime}–{r.endTime} · {formatVnd(r.pricePerHour)}</span><Button isIconOnly variant="danger" aria-label="Xóa khung giá" onPress={() => void deletePricingRule(r.id).then(load)}><TrashBin className="size-4" /></Button></Card.Content></Card>)}</div></TabPanel>
      <TabPanel id="schedule"><div className="space-y-4"><Card><Card.Content className="p-5"><Form className="grid gap-4 md:grid-cols-2" onSubmit={addSchedule}><MiniField name="startAt" label="Đóng từ" type="datetime-local" /><MiniField name="endAt" label="Đóng đến" type="datetime-local" /><MiniField name="reason" label="Lý do" required={false} /><Button type="submit" className="md:col-span-2">Thêm lịch đóng</Button></Form></Card.Content></Card>{schedules.map((s) => <Card key={s.id}><Card.Content className="flex items-center justify-between p-4"><span>{formatDateTime(s.startAt)} → {formatDateTime(s.endAt)}{s.reason ? ` · ${s.reason}` : ""}</span><Button isIconOnly variant="danger" aria-label="Xóa lịch đóng" onPress={() => void deleteCourtSchedule(s.id).then(load)}><TrashBin className="size-4" /></Button></Card.Content></Card>)}</div></TabPanel>
    </Tabs></div>;
}

function SimpleSelect({ name, label, defaultValue, items }: { name: string; label: string; defaultValue: string; items: string[][] }) { return <Select isRequired name={name} defaultValue={defaultValue}><Label>{label}</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{items.map(([id,text]) => <ListBox.Item id={id} key={id} textValue={text}>{text}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>; }
function MiniField({ name, label, type = "text", required = true }: { name: string; label: string; type?: string; required?: boolean }) { return <TextField isRequired={required} name={name} type={type}><Label>{label}</Label><Input /><FieldError /></TextField>; }
