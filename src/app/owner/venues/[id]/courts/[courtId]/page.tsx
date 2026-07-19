"use client";

import { use, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  AlertDialog,
  Breadcrumbs,
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  Table,
  Tabs,
  TextField,
} from "@heroui/react";
import Calendar from "@gravity-ui/icons/Calendar";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import Tags from "@gravity-ui/icons/Tags";
import TrashBin from "@gravity-ui/icons/TrashBin";
import {
  createCourtSchedule,
  createPricingRule,
  deleteCourtSchedule,
  deletePricingRule,
  getCourt,
  getCourtSchedules,
  getPricingRules,
  updateCourt,
  updatePricingRule,
} from "@/lib/api/owner";
import { getAllSports } from "@/lib/api/discovery";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerEmptyState } from "@/components/owner/owner-ui";
import type { CourtDto, CourtScheduleDto, PricingRuleDto, SportDto } from "@/lib/types/api";
import { formatDate, formatDateTime, formatVnd } from "@/lib/utils/format";
import { formatWeekday, getCourtTab } from "@/components/owner/venue-detail-model";

export default function CourtManagementPage({ params }: { params: Promise<{ id: string; courtId: string }> }) {
  const { id, courtId } = use(params);
  return <OwnerGuard><OwnerShell activeItem="venues"><CourtManager venueId={Number(id)} courtId={Number(courtId)} /></OwnerShell></OwnerGuard>;
}

function CourtManager({ venueId, courtId }: { venueId: number; courtId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = getCourtTab(searchParams.get("tab"));
  const [court, setCourt] = useState<CourtDto | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [rules, setRules] = useState<PricingRuleDto[]>([]);
  const [schedules, setSchedules] = useState<CourtScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRuleDto | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<PricingRuleDto | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<CourtScheduleDto | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const [courtData, sportData, ruleData, scheduleData] = await Promise.all([
        getCourt(courtId),
        getAllSports(),
        getPricingRules(courtId),
        getCourtSchedules(courtId),
      ]);
      setCourt(courtData);
      setSports(sportData);
      setRules(ruleData);
      setSchedules(scheduleData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải sân");
    } finally {
      setLoading(false);
    }
  }, [courtId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!court) return <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error || "Không tìm thấy sân"}</Alert.Description></Alert.Content></Alert>;

  async function saveCourt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      await updateCourt(courtId, { name: String(data.get("name")), sportId: Number(data.get("sportId")), indoor: data.get("indoor") === "true", status: String(data.get("status")) });
      await load();
    } catch { /* apiFetch shows the toast. */ }
    finally { setPending(false); }
  }

  async function saveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = { dayOfWeek: Number(data.get("dayOfWeek")), startTime: String(data.get("startTime")), endTime: String(data.get("endTime")), pricePerHour: Number(data.get("pricePerHour")), effectiveFrom: String(data.get("effectiveFrom")), effectiveTo: String(data.get("effectiveTo")) || undefined };
    setPending(true); setError("");
    try {
      if (editingRule) await updatePricingRule(editingRule.id, body);
      else await createPricingRule(courtId, body);
      await load(); setRuleModalOpen(false); setEditingRule(null);
    } catch { /* apiFetch shows the toast. */ }
    finally { setPending(false); }
  }

  async function addSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      await createCourtSchedule(courtId, { startAt: new Date(String(data.get("startAt"))).toISOString(), endAt: new Date(String(data.get("endAt"))).toISOString(), reason: String(data.get("reason")) || undefined });
      await load(); setScheduleModalOpen(false);
    } catch { /* apiFetch shows the toast. */ }
    finally { setPending(false); }
  }

  async function removeRule() {
    if (!ruleToDelete) return;
    setPending(true); setError("");
    try { await deletePricingRule(ruleToDelete.id); await load(); setRuleToDelete(null); }
    catch { /* apiFetch shows the toast. */ }
    finally { setPending(false); }
  }

  async function removeSchedule() {
    if (!scheduleToDelete) return;
    setPending(true); setError("");
    try { await deleteCourtSchedule(scheduleToDelete.id); await load(); setScheduleToDelete(null); }
    catch { /* apiFetch shows the toast. */ }
    finally { setPending(false); }
  }

  const openRuleModal = (rule: PricingRuleDto | null = null) => { setEditingRule(rule); setRuleModalOpen(true); };

  return <div className="mx-auto max-w-[1200px] space-y-6">
    <Breadcrumbs><Breadcrumbs.Item href="/owner/venues">Cơ sở của tôi</Breadcrumbs.Item><Breadcrumbs.Item href={`/owner/venues/${venueId}?tab=courts`}>Danh sách sân</Breadcrumbs.Item><Breadcrumbs.Item>{court.name}</Breadcrumbs.Item></Breadcrumbs>
    <div><h1 className="text-2xl font-bold">{court.name}</h1><p className="mt-1 text-sm text-muted">Quản lý thông tin, bảng giá và lịch đóng sân.</p></div>
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    <Tabs selectedKey={selectedTab} onSelectionChange={(key) => router.replace(`${pathname}?tab=${getCourtTab(String(key))}`, { scroll: false })}>
      <TabList aria-label="Quản lý sân" className="!flex !max-w-full !justify-start gap-2 overflow-x-auto ![inline-size:fit-content] [&_[role=tab]]:!w-auto"><Tab id="info">Thông tin</Tab><Tab id="pricing">Bảng giá</Tab><Tab id="schedule">Lịch đóng sân</Tab></TabList>
      <TabPanel id="info"><Card className="h-auto min-h-0"><Card.Content className="p-5"><Form className="grid gap-4 md:grid-cols-2" onSubmit={saveCourt}><TextField isRequired name="name" defaultValue={court.name}><Label>Tên sân</Label><Input /><FieldError /></TextField><SimpleSelect name="sportId" label="Môn thể thao" defaultValue={String(court.sportId)} items={sports.map((sport) => [String(sport.id), sport.name])} /><SimpleSelect name="indoor" label="Loại sân" defaultValue={String(court.indoor)} items={[["true", "Trong nhà"], ["false", "Ngoài trời"]]} /><SimpleSelect name="status" label="Trạng thái" defaultValue={court.status} items={[["Available", "Sẵn sàng"], ["Maintenance", "Bảo trì"], ["Inactive", "Ngưng hoạt động"]]} /><Button type="submit" className="md:col-span-2 md:justify-self-end" variant="primary" isPending={pending}>Lưu thay đổi</Button></Form></Card.Content></Card></TabPanel>
      <TabPanel id="pricing"><PricingSection rules={rules} onAdd={() => openRuleModal()} onEdit={openRuleModal} onDelete={setRuleToDelete} /></TabPanel>
      <TabPanel id="schedule"><ScheduleSection schedules={schedules} onAdd={() => setScheduleModalOpen(true)} onDelete={setScheduleToDelete} /></TabPanel>
    </Tabs>

    <Modal.Backdrop isOpen={ruleModalOpen} onOpenChange={(open) => { if (!pending) { setRuleModalOpen(open); if (!open) setEditingRule(null); } }}><Modal.Container size="md"><Modal.Dialog><Modal.CloseTrigger /><Modal.Header><Modal.Heading>{editingRule ? "Chỉnh sửa bảng giá" : "Thêm bảng giá"}</Modal.Heading></Modal.Header><Modal.Body><RuleForm key={editingRule?.id ?? "new"} rule={editingRule} onSubmit={saveRule} /></Modal.Body><Modal.Footer><Button variant="tertiary" onPress={() => setRuleModalOpen(false)} isDisabled={pending}>Hủy</Button><Button form="pricing-rule-form" type="submit" variant="primary" isPending={pending}>{editingRule ? "Lưu thay đổi" : "Thêm bảng giá"}</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>

    <Modal.Backdrop isOpen={scheduleModalOpen} onOpenChange={(open) => { if (!pending) setScheduleModalOpen(open); }}><Modal.Container size="md"><Modal.Dialog><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Thêm lịch đóng sân</Modal.Heading></Modal.Header><Modal.Body><Form id="court-schedule-form" className="grid gap-4 sm:grid-cols-2" onSubmit={addSchedule}><MiniField name="startAt" label="Đóng từ" type="datetime-local" /><MiniField name="endAt" label="Đóng đến" type="datetime-local" /><div className="sm:col-span-2"><MiniField name="reason" label="Lý do" required={false} /></div></Form></Modal.Body><Modal.Footer><Button variant="tertiary" onPress={() => setScheduleModalOpen(false)} isDisabled={pending}>Hủy</Button><Button form="court-schedule-form" type="submit" variant="primary" isPending={pending}>Thêm lịch đóng</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>

    <DeleteDialog isOpen={ruleToDelete !== null} title="Xóa khung giá?" description={ruleToDelete ? `${formatWeekday(ruleToDelete.dayOfWeek)}, ${ruleToDelete.startTime.slice(0, 5)}–${ruleToDelete.endTime.slice(0, 5)} sẽ bị xóa.` : ""} pending={pending} onClose={() => setRuleToDelete(null)} onConfirm={removeRule} />
    <DeleteDialog isOpen={scheduleToDelete !== null} title="Xóa lịch đóng sân?" description="Khoảng thời gian đóng sân này sẽ bị xóa." pending={pending} onClose={() => setScheduleToDelete(null)} onConfirm={removeSchedule} />
  </div>;
}

function PricingSection({ rules, onAdd, onEdit, onDelete }: { rules: PricingRuleDto[]; onAdd: () => void; onEdit: (rule: PricingRuleDto) => void; onDelete: (rule: PricingRuleDto) => void }) {
  const action = <Button variant="primary" onPress={onAdd}><Plus className="size-4" />Thêm bảng giá</Button>;
  return <div className="space-y-5"><SectionHeader title="Bảng giá theo giờ" description="Thiết lập giá theo ngày và khung giờ." action={rules.length ? action : undefined} />{rules.length === 0 ? <OwnerEmptyState icon={Tags} title="Chưa có bảng giá" description="Thêm khung giá đầu tiên để sân có thể nhận đặt chỗ." action={action} /> : <><div className="hidden md:block"><Table><Table.ScrollContainer><Table.Content aria-label="Bảng giá sân"><Table.Header><Table.Column isRowHeader>Ngày</Table.Column><Table.Column>Khung giờ</Table.Column><Table.Column>Giá mỗi giờ</Table.Column><Table.Column>Hiệu lực</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header><Table.Body>{rules.map((rule) => <Table.Row id={rule.id} key={rule.id}><Table.Cell>{formatWeekday(rule.dayOfWeek)}</Table.Cell><Table.Cell>{rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}</Table.Cell><Table.Cell>{formatVnd(rule.pricePerHour)}</Table.Cell><Table.Cell>{formatDate(rule.effectiveFrom)}{rule.effectiveTo ? ` – ${formatDate(rule.effectiveTo)}` : " trở đi"}</Table.Cell><Table.Cell><div className="flex gap-1"><Button isIconOnly variant="tertiary" aria-label={`Chỉnh sửa giá ${formatWeekday(rule.dayOfWeek)}`} onPress={() => onEdit(rule)}><Pencil className="size-4" /></Button><Button isIconOnly variant="tertiary" aria-label={`Xóa giá ${formatWeekday(rule.dayOfWeek)}`} onPress={() => onDelete(rule)}><TrashBin className="size-4 text-danger" /></Button></div></Table.Cell></Table.Row>)}</Table.Body></Table.Content></Table.ScrollContainer></Table></div><div className="grid gap-3 md:hidden">{rules.map((rule) => <Card key={rule.id} className="h-auto min-h-0"><Card.Content className="space-y-3 p-4"><div className="flex items-start justify-between"><div><p className="font-semibold">{formatWeekday(rule.dayOfWeek)}</p><p className="text-sm text-muted">{rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}</p></div><p className="font-semibold">{formatVnd(rule.pricePerHour)}</p></div><p className="text-xs text-muted">Hiệu lực {formatDate(rule.effectiveFrom)}{rule.effectiveTo ? ` – ${formatDate(rule.effectiveTo)}` : " trở đi"}</p><div className="flex justify-end gap-2"><Button size="sm" variant="tertiary" onPress={() => onEdit(rule)}><Pencil className="size-4" />Sửa</Button><Button size="sm" variant="tertiary" onPress={() => onDelete(rule)}><TrashBin className="size-4 text-danger" />Xóa</Button></div></Card.Content></Card>)}</div></>}</div>;
}

function ScheduleSection({ schedules, onAdd, onDelete }: { schedules: CourtScheduleDto[]; onAdd: () => void; onDelete: (schedule: CourtScheduleDto) => void }) {
  const action = <Button variant="primary" onPress={onAdd}><Plus className="size-4" />Thêm lịch đóng</Button>;
  return <div className="space-y-5"><SectionHeader title="Lịch đóng sân" description="Khóa các khoảng thời gian bảo trì hoặc ngừng phục vụ." action={schedules.length ? action : undefined} />{schedules.length === 0 ? <OwnerEmptyState icon={Calendar} title="Chưa có lịch đóng sân" description="Sân đang mở theo giờ hoạt động của cơ sở." action={action} /> : <><div className="hidden md:block"><Table><Table.ScrollContainer><Table.Content aria-label="Lịch đóng sân"><Table.Header><Table.Column isRowHeader>Bắt đầu</Table.Column><Table.Column>Kết thúc</Table.Column><Table.Column>Lý do</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header><Table.Body>{schedules.map((schedule) => <Table.Row id={schedule.id} key={schedule.id}><Table.Cell>{formatDateTime(schedule.startAt)}</Table.Cell><Table.Cell>{formatDateTime(schedule.endAt)}</Table.Cell><Table.Cell>{schedule.reason || "—"}</Table.Cell><Table.Cell><Button isIconOnly variant="tertiary" aria-label={`Xóa lịch đóng từ ${formatDateTime(schedule.startAt)}`} onPress={() => onDelete(schedule)}><TrashBin className="size-4 text-danger" /></Button></Table.Cell></Table.Row>)}</Table.Body></Table.Content></Table.ScrollContainer></Table></div><div className="grid gap-3 md:hidden">{schedules.map((schedule) => <Card key={schedule.id} className="h-auto min-h-0"><Card.Content className="space-y-2 p-4"><p className="font-medium">{formatDateTime(schedule.startAt)}</p><p className="text-sm text-muted">đến {formatDateTime(schedule.endAt)}</p>{schedule.reason && <p className="text-sm">{schedule.reason}</p>}<div className="flex justify-end"><Button size="sm" variant="tertiary" onPress={() => onDelete(schedule)}><TrashBin className="size-4 text-danger" />Xóa</Button></div></Card.Content></Card>)}</div></>}</div>;
}

function RuleForm({ rule, onSubmit }: { rule: PricingRuleDto | null; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <Form id="pricing-rule-form" className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}><SimpleSelect name="dayOfWeek" label="Ngày trong tuần" defaultValue={String(rule?.dayOfWeek ?? 1)} items={[["1", "Thứ 2"], ["2", "Thứ 3"], ["3", "Thứ 4"], ["4", "Thứ 5"], ["5", "Thứ 6"], ["6", "Thứ 7"], ["7", "Chủ nhật"]]} /><MiniField name="pricePerHour" label="Giá mỗi giờ" type="number" defaultValue={rule ? String(rule.pricePerHour) : undefined} /><MiniField name="startTime" label="Bắt đầu" type="time" defaultValue={rule?.startTime.slice(0, 5)} /><MiniField name="endTime" label="Kết thúc" type="time" defaultValue={rule?.endTime.slice(0, 5)} /><MiniField name="effectiveFrom" label="Hiệu lực từ" type="date" defaultValue={rule?.effectiveFrom.split("T")[0]} /><MiniField name="effectiveTo" label="Đến ngày" type="date" required={false} defaultValue={rule?.effectiveTo?.split("T")[0]} /></Form>;
}

function DeleteDialog({ isOpen, title, description, pending, onClose, onConfirm }: { isOpen: boolean; title: string; description: string; pending: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
  return <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open && !pending) onClose(); }}><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>{title}</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>{description}</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary" isDisabled={pending}>Hủy</Button><Button variant="danger" isPending={pending} onPress={() => void onConfirm()}>Xóa</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop>;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p></div>{action}</div>;
}

function SimpleSelect({ name, label, defaultValue, items }: { name: string; label: string; defaultValue: string; items: string[][] }) {
  return <Select isRequired name={name} defaultValue={defaultValue}><Label>{label}</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{items.map(([id, text]) => <ListBox.Item id={id} key={id} textValue={text}>{text}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>;
}

function MiniField({ name, label, type = "text", required = true, defaultValue }: { name: string; label: string; type?: string; required?: boolean; defaultValue?: string }) {
  return <TextField isRequired={required} name={name} type={type} defaultValue={defaultValue}><Label>{label}</Label><Input /><FieldError /></TextField>;
}
