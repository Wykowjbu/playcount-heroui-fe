"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseTime } from "@internationalized/date";
import {
  Alert,
  AlertDialog,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Dropdown,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Select,
  Skeleton,
  Switch,
  Table,
  Tabs,
  TextField,
  TimeField,
} from "@heroui/react";

import ArrowLeft from "@gravity-ui/icons/ArrowLeft";
import Calendar from "@gravity-ui/icons/Calendar";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import Clock from "@gravity-ui/icons/Clock";
import Ellipsis from "@gravity-ui/icons/Ellipsis";
import Eye from "@gravity-ui/icons/Eye";
import Pencil from "@gravity-ui/icons/Pencil";
import PersonPlus from "@gravity-ui/icons/PersonPlus";
import Persons from "@gravity-ui/icons/Persons";
import Picture from "@gravity-ui/icons/Picture";
import Plus from "@gravity-ui/icons/Plus";
import Tags from "@gravity-ui/icons/Tags";
import TrashBin from "@gravity-ui/icons/TrashBin";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerButtonLink, OwnerEmptyState, OwnerStatusChip } from "@/components/owner/owner-ui";
import {
  addStaff,
  addVenueAmenity,
  addVenueImage,
  deleteCourt,
  deleteVenueImage,
  getCourts,
  getMyVenueById,
  getVenueStaff,
  removeStaff,
  removeVenueAmenity,
  setCoverImage,
  updateOpeningHours,
} from "@/lib/api/owner";
import { getAllAmenities } from "@/lib/api/discovery";
import { uploadFile, validateImageFile } from "@/lib/api/upload";
import type {
  CourtDto,
  OpeningHourDto,
  VenueResponseDto,
  VenueStaffResponseDto,
} from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";
import {
  formatWeekday,
  getVenueTab,
  normalizeOpeningHours,
  validateOpeningHours,
} from "@/components/owner/venue-detail-model";

const STAFF_ROLES: Record<string, string> = {
  Manager: "Quản lý",
  Receptionist: "Lễ tân",
  Accountant: "Kế toán",
};

type AmenityOption = { id: number; name: string; description: string | null };

export default function OwnerVenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <OwnerGuard>
      <OwnerShell activeItem="venues">
        <VenueDetail venueId={Number(id)} />
      </OwnerShell>
    </OwnerGuard>
  );
}

function VenueDetail({ venueId }: { venueId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = getVenueTab(searchParams.get("tab"));
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVenue = useCallback(async () => {
    try {
      setError("");
      const [venueData, courtData] = await Promise.all([
        getMyVenueById(venueId),
        getCourts(venueId),
      ]);
      setVenue(venueData);
      setCourts(courtData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải cơ sở");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => { void loadVenue(); }, [loadVenue]);

  function selectTab(key: React.Key) {
    const tab = getVenueTab(String(key));
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  if (loading) return <VenueDetailSkeleton />;

  if (!venue) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Không thể tải cơ sở</Alert.Title>
          <Alert.Description>{error || "Không tìm thấy cơ sở."}</Alert.Description>
          <Button className="mt-3" size="sm" variant="tertiary" onPress={() => void loadVenue()}>Thử lại</Button>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-5">
      <Breadcrumbs className="hidden sm:flex">
        <Breadcrumbs.Item href="/owner/venues">Cơ sở của tôi</Breadcrumbs.Item>
        <Breadcrumbs.Item>{venue.name}</Breadcrumbs.Item>
      </Breadcrumbs>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <OwnerButtonLink href="/owner/venues" isIconOnly label="Quay lại danh sách cơ sở" variant="tertiary"><ArrowLeft className="size-5" /></OwnerButtonLink>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-[28px]">{venue.name}</h1>
              <OwnerStatusChip kind="venue" status={venue.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{venue.address}</p>
          </div>
        </div>
        <OwnerButtonLink className="self-start" href={`/owner/venues/${venueId}/edit`} variant="secondary"><Pencil className="size-4" />Chỉnh sửa</OwnerButtonLink>
      </header>

      <VenueStatusNotice status={venue.status} />

      {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}

      <Tabs className="w-full" selectedKey={selectedTab} onSelectionChange={selectTab}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Quản lý cơ sở">
            <Tabs.Tab id="overview">Tổng quan<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="courts">Sân ({courts.length})<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="hours">Giờ mở cửa<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="amenities">Tiện ích<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="images">Hình ảnh{venue.images.length ? ` (${venue.images.length})` : ""}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="staff">Nhân viên<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="overview" className="pt-4">
          <OverviewTab venue={venue} courts={courts} onSelectTab={selectTab} />
        </Tabs.Panel>
        <Tabs.Panel id="courts" className="pt-4">
          <CourtsTab venueId={venueId} courts={courts} onRefresh={loadVenue} />
        </Tabs.Panel>
        <Tabs.Panel id="hours" className="pt-4">
          <OpeningHoursTab venueId={venueId} hours={venue.openingHours} onRefresh={loadVenue} />
        </Tabs.Panel>
        <Tabs.Panel id="amenities" className="pt-4">
          <AmenitiesTab active={selectedTab === "amenities"} venue={venue} onRefresh={loadVenue} />
        </Tabs.Panel>
        <Tabs.Panel id="images" className="pt-4">
          <ImagesTab venue={venue} onRefresh={loadVenue} />
        </Tabs.Panel>
        <Tabs.Panel id="staff" className="pt-4">
          <StaffTab active={selectedTab === "staff"} venueId={venueId} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function VenueDetailSkeleton() {
  return <div className="mx-auto max-w-[1320px] space-y-5"><Skeleton className="h-7 w-56 rounded-lg" /><div className="flex justify-between"><div className="space-y-3"><Skeleton className="h-9 w-80 rounded-xl" /><Skeleton className="h-5 w-96 rounded-lg" /></div><Skeleton className="h-10 w-28 rounded-xl" /></div><Skeleton className="h-11 w-full rounded-xl" /><div className="grid gap-5 lg:grid-cols-12"><Skeleton className="h-72 rounded-2xl lg:col-span-8" /><Skeleton className="h-72 rounded-2xl lg:col-span-4" /></div></div>;
}

function VenueStatusNotice({ status }: { status: string }) {
  if (status === "Approved") return null;
  const copy: Record<string, { title: string; text: string; tone: "warning" | "danger" }> = {
    Pending: { title: "Cơ sở đang chờ Admin duyệt", text: "Cơ sở chưa xuất hiện công khai. Bạn vẫn có thể cập nhật thông tin; thao tác này không làm thay đổi trạng thái.", tone: "warning" },
    Rejected: { title: "Cơ sở chưa được phê duyệt", text: "Bạn có thể tiếp tục cập nhật thông tin. Trạng thái chỉ thay đổi khi Admin xử lý.", tone: "danger" },
    Suspended: { title: "Cơ sở đang tạm dừng công khai", text: "Việc cập nhật thông tin không đồng nghĩa cơ sở đã được phê duyệt lại.", tone: "warning" },
  };
  const item = copy[status];
  if (!item) return null;
  return <Alert status={item.tone}><Alert.Indicator /><Alert.Content><Alert.Title>{item.title}</Alert.Title><Alert.Description>{item.text}</Alert.Description></Alert.Content></Alert>;
}

function OverviewTab({ venue, courts, onSelectTab }: { venue: VenueResponseDto; courts: CourtDto[]; onSelectTab: (key: React.Key) => void }) {
  const setup = [
    { label: "Đã có ít nhất một sân", done: courts.length > 0, tab: "courts" as const },
    { label: "Đã cấu hình giờ mở cửa", done: venue.openingHours.some((hour) => !hour.isClosed), tab: "hours" as const },
    { label: "Đã chọn tiện ích", done: venue.amenities.length > 0, tab: "amenities" as const },
    { label: "Đã có ảnh bìa", done: venue.images.some((image) => image.isCover), tab: "images" as const },
  ];
  const complete = setup.every((item) => item.done);

  return <div className="grid gap-5 lg:grid-cols-12">
    <Card className="border border-[var(--border)] bg-[var(--surface)] lg:col-span-8">
      <Card.Header className="border-b border-[var(--separator)] px-4 py-4 sm:px-6"><Card.Title className="text-[17px] font-semibold">Thông tin cơ sở</Card.Title></Card.Header>
      <Card.Content className="px-4 py-2 sm:px-6">
        <dl className="divide-y divide-[var(--separator)] text-sm">
          <InfoRow label="Địa chỉ" value={venue.address} />
          <InfoRow label="Số điện thoại" value={venue.phone || "Chưa cập nhật"} muted={!venue.phone} />
          <InfoRow label="Mô tả" value={venue.description || "Chưa có mô tả"} muted={!venue.description} wide />
          <InfoRow label="Ngày tạo" value={formatDate(venue.createdAt)} />
          {venue.updatedAt && <InfoRow label="Cập nhật gần nhất" value={formatDate(venue.updatedAt)} />}
        </dl>
      </Card.Content>
    </Card>

    <Card className="border border-[var(--border)] bg-[var(--surface)] lg:col-span-4">
      <Card.Header className="border-b border-[var(--separator)] px-4 py-4 sm:px-5"><Card.Title className="text-[17px] font-semibold">{complete ? "Tổng quan vận hành" : "Hoàn thiện cơ sở"}</Card.Title></Card.Header>
      <Card.Content className="p-4 sm:p-5">
        {complete ? <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--separator)]">
          <Metric label="Tổng sân" value={courts.length} />
          <Metric label="Sân sẵn sàng" value={courts.filter((court) => court.status === "Available").length} />
          <Metric label="Tiện ích" value={venue.amenities.length} />
          <Metric label="Hình ảnh" value={venue.images.length} />
        </div> : <div className="space-y-1">{setup.map((item) => <Button key={item.label} className="h-11 w-full justify-start px-2" variant="ghost" onPress={() => onSelectTab(item.tab)}>{item.done ? <CircleCheck className="size-5 text-[var(--success)]" /> : <CircleExclamation className="size-5 text-[var(--warning)]" />}<span className="flex-1 text-left text-sm">{item.label}</span>{item.done ? <span className="text-xs text-[var(--muted)]">Đã xong</span> : <span className="text-xs text-[var(--accent)]">Thiết lập</span>}</Button>)}</div>}
      </Card.Content>
    </Card>
  </div>;
}

function InfoRow({ label, value, muted = false, wide = false }: { label: string; value: string; muted?: boolean; wide?: boolean }) {
  return <div className={`grid min-h-12 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4 ${wide ? "items-start" : "items-center"}`}><dt className="text-[var(--muted)]">{label}</dt><dd className={muted ? "text-[var(--muted)]" : "text-[var(--foreground)]"}>{value}</dd></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="min-h-24 bg-[var(--surface)] p-4"><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{label}</p></div>;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{description}</p></div>{action}</div>;
}

function CourtsTab({ venueId, courts, onRefresh }: { venueId: number; courts: CourtDto[]; onRefresh: () => Promise<void> }) {
  const [courtToDelete, setCourtToDelete] = useState<CourtDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function removeCourt() {
    if (!courtToDelete) return;
    setDeleting(true);
    try { await deleteCourt(courtToDelete.id); setCourtToDelete(null); await onRefresh(); }
    catch { /* apiFetch shows the toast. */ }
    finally { setDeleting(false); }
  }

  const addAction = <OwnerButtonLink href={`/owner/venues/${venueId}/courts/new`}><Plus className="size-4" />Thêm sân</OwnerButtonLink>;
  return <div className="space-y-5"><SectionHeader title="Danh sách sân" description="Quản lý thông tin, bảng giá và lịch đóng sân." action={addAction} />
    {courts.length === 0 ? <OwnerEmptyState icon={Calendar} title="Chưa có sân nào" description="Thêm sân đầu tiên để bắt đầu cấu hình bảng giá và nhận đặt sân." action={addAction} /> : <>
      <div className="hidden md:block"><Table><Table.ScrollContainer><Table.Content aria-label="Danh sách sân" className="min-w-[760px]"><Table.Header><Table.Column isRowHeader>Sân</Table.Column><Table.Column>Bộ môn</Table.Column><Table.Column>Loại sân</Table.Column><Table.Column>Trạng thái</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header><Table.Body>{courts.map((court) => <Table.Row id={court.id} key={court.id} className="h-[68px]"><Table.Cell><p className="font-medium">{court.name}</p></Table.Cell><Table.Cell>{court.sportName}</Table.Cell><Table.Cell>{court.indoor ? "Trong nhà" : "Ngoài trời"}</Table.Cell><Table.Cell><OwnerStatusChip kind="court" status={court.status} /></Table.Cell><Table.Cell><CourtActions court={court} venueId={venueId} onDelete={setCourtToDelete} /></Table.Cell></Table.Row>)}</Table.Body></Table.Content></Table.ScrollContainer></Table></div>
      <div className="space-y-3 md:hidden">{courts.map((court) => <Card key={court.id} className="border border-[var(--border)] bg-[var(--surface)]"><Card.Content className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{court.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{court.sportName} · {court.indoor ? "Trong nhà" : "Ngoài trời"}</p></div><OwnerStatusChip kind="court" status={court.status} /></div><div className="flex justify-end"><CourtActions court={court} venueId={venueId} onDelete={setCourtToDelete} labeled /></div></Card.Content></Card>)}</div>
    </>}
    <AlertDialog.Backdrop isOpen={!!courtToDelete} onOpenChange={(open) => { if (!open && !deleting) setCourtToDelete(null); }}><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Xóa {courtToDelete?.name}?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>Sân và các cấu hình liên quan sẽ bị xóa. Thao tác này không thể hoàn tác.</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary" isDisabled={deleting}>Hủy</Button><Button variant="danger" isPending={deleting} onPress={() => void removeCourt()}>Xóa sân</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop>
  </div>;
}

function CourtActions({ court, venueId, onDelete, labeled = false }: { court: CourtDto; venueId: number; onDelete: (court: CourtDto) => void; labeled?: boolean }) {
  return <Dropdown><Button isIconOnly={!labeled} variant="tertiary" aria-label={`Thao tác với ${court.name}`}>{labeled ? "Xem và quản lý" : <Ellipsis className="size-5" />}</Button><Dropdown.Popover placement="bottom end"><Dropdown.Menu aria-label={`Thao tác với ${court.name}`} onAction={(key) => { if (key === "delete") onDelete(court); }}><Dropdown.Item id="edit" textValue="Chỉnh sửa sân" href={`/owner/venues/${venueId}/courts/${court.id}?tab=info`}><Pencil className="size-4" />Chỉnh sửa sân</Dropdown.Item><Dropdown.Item id="pricing" textValue="Quản lý bảng giá" href={`/owner/venues/${venueId}/courts/${court.id}?tab=pricing`}><Tags className="size-4" />Quản lý bảng giá</Dropdown.Item><Dropdown.Item id="schedule" textValue="Lịch đóng sân" href={`/owner/venues/${venueId}/courts/${court.id}?tab=schedule`}><Calendar className="size-4" />Lịch đóng sân</Dropdown.Item><Dropdown.Item id="delete" textValue="Xóa sân" variant="danger"><TrashBin className="size-4" />Xóa sân</Dropdown.Item></Dropdown.Menu></Dropdown.Popover></Dropdown>;
}

function OpeningHoursTab({ venueId, hours, onRefresh }: { venueId: number; hours: OpeningHourDto[]; onRefresh: () => Promise<void> }) {
  const normalized = normalizeOpeningHours(hours);
  const [localHours, setLocalHours] = useState<OpeningHourDto[]>(normalized);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setLocalHours(normalizeOpeningHours(hours)); }, [hours]);
  const dirty = JSON.stringify(localHours) !== JSON.stringify(normalized);

  function updateDay(index: number, changes: Partial<OpeningHourDto>) { setLocalHours((current) => current.map((hour, itemIndex) => itemIndex === index ? { ...hour, ...changes } : hour)); }
  async function save() {
    const validationError = validateOpeningHours(localHours);
    if (validationError) { setError(validationError); return; }
    setSaving(true); setError("");
    try { await updateOpeningHours(venueId, localHours); await onRefresh(); }
    catch { /* apiFetch shows the toast. */ }
    finally { setSaving(false); }
  }

  return <div className="max-w-[980px] space-y-5"><SectionHeader title="Giờ mở cửa" description="Thiết lập thời gian hoạt động cho từng ngày trong tuần." />{error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    <Card className="h-auto min-h-0 border border-[var(--border)] bg-[var(--surface)]"><Card.Header className="flex-row items-center justify-start gap-2 border-b border-[var(--separator)] px-4 py-4 text-left sm:px-6"><Clock className="size-5" /><Card.Title className="text-[17px] font-semibold">Lịch hoạt động</Card.Title></Card.Header><Card.Content className="px-4 sm:px-6">{localHours.map((hour, index) => <div key={hour.dayOfWeek} className="grid gap-3 border-b border-[var(--separator)] py-4 last:border-0 sm:grid-cols-[112px_120px_minmax(0,340px)] sm:items-center"><p className="font-medium">{formatWeekday(hour.dayOfWeek)}</p><Switch isSelected={!hour.isClosed} onChange={(selected) => updateDay(index, { isClosed: !selected, openTime: selected ? hour.openTime ?? "06:00:00" : hour.openTime, closeTime: selected ? hour.closeTime ?? "22:00:00" : hour.closeTime })}><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>{hour.isClosed ? "Nghỉ" : "Mở cửa"}</Switch.Content></Switch><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><TimeField aria-label={`Giờ mở cửa ${formatWeekday(hour.dayOfWeek)}`} granularity="minute" hourCycle={24} isDisabled={hour.isClosed} value={hour.openTime ? parseTime(hour.openTime) : null} onChange={(value) => updateDay(index, { openTime: value?.toString() ?? null })}><TimeField.Group><TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input></TimeField.Group></TimeField><span className="text-[var(--muted)]">–</span><TimeField aria-label={`Giờ đóng cửa ${formatWeekday(hour.dayOfWeek)}`} granularity="minute" hourCycle={24} isDisabled={hour.isClosed} value={hour.closeTime ? parseTime(hour.closeTime) : null} onChange={(value) => updateDay(index, { closeTime: value?.toString() ?? null })}><TimeField.Group><TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input></TimeField.Group></TimeField></div></div>)}</Card.Content><Card.Footer className="justify-end border-t border-[var(--separator)] px-4 py-4 sm:px-6"><Button className="w-full sm:w-auto" variant="primary" isDisabled={!dirty || saving} isPending={saving} onPress={() => void save()}>Lưu giờ mở cửa</Button></Card.Footer></Card>
  </div>;
}

function AmenitiesTab({ active, venue, onRefresh }: { active: boolean; venue: VenueResponseDto; onRefresh: () => Promise<void> }) {
  const [amenities, setAmenities] = useState<AmenityOption[]>([]);
  const [selected, setSelected] = useState(() => new Set(venue.amenities.map((item) => item.id)));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setSelected(new Set(venue.amenities.map((item) => item.id))); }, [venue.amenities]);
  useEffect(() => { if (!active || amenities.length) return; setLoading(true); getAllAmenities().then(setAmenities).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Không thể tải tiện ích")).finally(() => setLoading(false)); }, [active, amenities.length]);
  const original = new Set(venue.amenities.map((item) => item.id));
  const dirty = selected.size !== original.size || [...selected].some((id) => !original.has(id));
  const visible = amenities.filter((item) => item.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")));

  async function save() {
    setSaving(true); setError("");
    try { await Promise.all([...selected].filter((id) => !original.has(id)).map((id) => addVenueAmenity(venue.id, id))); await Promise.all([...original].filter((id) => !selected.has(id)).map((id) => removeVenueAmenity(venue.id, id))); await onRefresh(); }
    catch { /* apiFetch shows the toast. */ }
    finally { setSaving(false); }
  }

  return <div className="max-w-[980px] space-y-5"><SectionHeader title="Tiện ích" description="Chọn các tiện ích đang có tại cơ sở." />{error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    <Card className="border border-[var(--border)] bg-[var(--surface)]"><Card.Header className="flex-col items-stretch gap-3 border-b border-[var(--separator)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><Card.Title className="text-[17px] font-semibold">Danh mục tiện ích</Card.Title><Card.Description>{selected.size} tiện ích đang được chọn</Card.Description></div>{amenities.length > 8 && <SearchField value={search} onChange={setSearch} className="sm:w-72"><Label>Tìm tiện ích</Label><SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder="Nhập tên tiện ích" /><SearchField.ClearButton /></SearchField.Group></SearchField>}</Card.Header><Card.Content className="p-4 sm:p-6">{loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl" />)}</div> : visible.length === 0 ? <p className="py-8 text-center text-sm text-[var(--muted)]">Không tìm thấy tiện ích phù hợp.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((amenity) => <Checkbox key={amenity.id} isSelected={selected.has(amenity.id)} onChange={(checked) => setSelected((current) => { const next = new Set(current); if (checked) next.add(amenity.id); else next.delete(amenity.id); return next; })} className="min-h-12 rounded-xl border border-[var(--border)] px-3 py-2"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><span className="text-sm">{amenity.name}</span></Checkbox.Content></Checkbox>)}</div>}</Card.Content><Card.Footer className="flex-col gap-3 border-t border-[var(--separator)] px-4 py-4 sm:flex-row sm:justify-between sm:px-6"><p className="text-sm text-[var(--muted)]">Đã chọn {selected.size}/{amenities.length}</p><Button className="w-full sm:w-auto" variant="primary" isDisabled={!dirty || saving} isPending={saving} onPress={() => void save()}>Lưu tiện ích</Button></Card.Footer></Card>
  </div>;
}

function ImagesTab({ venue, onRefresh }: { venue: VenueResponseDto; onRefresh: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function addImage() { if (!file) return; const validation = validateImageFile(file); if (validation) { setError(validation); return; } setPending(true); setError(""); try { const { url } = await uploadFile(file, "venues"); await addVenueImage(venue.id, url); await onRefresh(); setModalOpen(false); setFile(null); if (inputRef.current) inputRef.current.value = ""; } catch { /* Upload/API helpers show the toast. */ } finally { setPending(false); } }
  async function removeImage() { if (imageToDelete == null) return; setPending(true); try { await deleteVenueImage(venue.id, imageToDelete); setImageToDelete(null); await onRefresh(); } catch { /* apiFetch shows the toast. */ } finally { setPending(false); } }
  async function cover(imageId: number) { setPending(true); try { await setCoverImage(venue.id, imageId); await onRefresh(); } catch { /* apiFetch shows the toast. */ } finally { setPending(false); } }
  const action = <Button variant="primary" onPress={() => setModalOpen(true)}><Plus className="size-4" />Thêm hình ảnh</Button>;
  return <div className="space-y-5"><SectionHeader title="Hình ảnh" description="Quản lý ảnh không gian và mặt sân của cơ sở." action={venue.images.length ? action : undefined} />{error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}{venue.images.length === 0 ? <OwnerEmptyState icon={Picture} title="Chưa có hình ảnh" description="Thêm ảnh rõ ràng về không gian và mặt sân để người chơi dễ nhận biết cơ sở." action={action} /> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{venue.images.map((image) => <Card key={image.id} className="group relative aspect-[4/3] overflow-hidden border border-[var(--border)] bg-[var(--surface-secondary)] p-0"><Image fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" src={image.imageUrl} alt={`Hình ảnh ${venue.name}`} className="object-cover" />{image.isCover && <Chip className="absolute left-2 top-2" size="sm" color="accent">Ảnh bìa</Chip>}<div className="absolute right-2 top-2"><Dropdown><Button isIconOnly aria-label="Thao tác hình ảnh" variant="secondary"><Ellipsis className="size-5" /></Button><Dropdown.Popover placement="bottom end"><Dropdown.Menu aria-label="Thao tác hình ảnh" onAction={(key) => { if (key === "cover") void cover(image.id); if (key === "delete") setImageToDelete(image.id); }}>{!image.isCover && <Dropdown.Item id="cover" textValue="Đặt làm ảnh bìa"><Eye className="size-4" />Đặt làm ảnh bìa</Dropdown.Item>}<Dropdown.Item id="delete" textValue="Xóa ảnh" variant="danger"><TrashBin className="size-4" />Xóa ảnh</Dropdown.Item></Dropdown.Menu></Dropdown.Popover></Dropdown></div></Card>)}</div>}
    <Modal.Backdrop isOpen={modalOpen} onOpenChange={(open) => { if (!pending) setModalOpen(open); }}><Modal.Container size="sm"><Modal.Dialog><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Thêm hình ảnh</Modal.Heading></Modal.Header><Modal.Body><TextField><Label>Chọn tệp ảnh</Label><Input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const nextFile = event.target.files?.[0] ?? null; setFile(nextFile); setError(nextFile ? validateImageFile(nextFile) ?? "" : ""); }} /><p className="mt-2 text-xs text-[var(--muted)]">PNG, JPEG hoặc WEBP, tối đa 5MB. Ảnh được tải lên Cloudflare R2 trước khi lưu URL.</p></TextField></Modal.Body><Modal.Footer><Button variant="tertiary" onPress={() => setModalOpen(false)} isDisabled={pending}>Hủy</Button><Button variant="primary" isDisabled={!file || !!error} isPending={pending} onPress={() => void addImage()}>Tải ảnh lên</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    <AlertDialog.Backdrop isOpen={imageToDelete != null} onOpenChange={(open) => { if (!open && !pending) setImageToDelete(null); }}><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Xóa hình ảnh?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>Hình ảnh sẽ bị gỡ khỏi cơ sở.</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary" isDisabled={pending}>Hủy</Button><Button variant="danger" isPending={pending} onPress={() => void removeImage()}>Xóa ảnh</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop>
  </div>;
}

function StaffTab({ active, venueId }: { active: boolean; venueId: number }) {
  const [staff, setStaff] = useState<VenueStaffResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<VenueStaffResponseDto | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); try { setStaff(await getVenueStaff(venueId)); setError(""); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Không thể tải nhân viên"); } finally { setLoading(false); } }, [venueId]);
  useEffect(() => { if (active && !staff.length) void load(); }, [active, load, staff.length]);
  async function add(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setPending(true); setError(""); try { await addStaff(venueId, { email: String(data.get("email")), role: String(data.get("role")) }); await load(); setModalOpen(false); } catch { /* apiFetch shows the toast. */ } finally { setPending(false); } }
  async function remove() { if (!staffToRemove) return; setPending(true); try { await removeStaff(venueId, staffToRemove.id); setStaffToRemove(null); await load(); } catch { /* apiFetch shows the toast. */ } finally { setPending(false); } }
  const action = <Button variant="primary" onPress={() => setModalOpen(true)}><PersonPlus className="size-4" />Thêm nhân viên</Button>;
  return <div className="space-y-5"><SectionHeader title="Nhân viên" description="Phân công nhân viên hỗ trợ vận hành cơ sở." action={!loading && staff.length ? action : undefined} />{error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}{loading ? <Skeleton className="h-52 rounded-2xl" /> : staff.length === 0 ? <OwnerEmptyState icon={Persons} title="Chưa có nhân viên" description="Thêm nhân viên bằng email tài khoản để hỗ trợ quản lý cơ sở." action={action} /> : <><div className="hidden md:block"><Table><Table.ScrollContainer><Table.Content aria-label="Danh sách nhân viên"><Table.Header><Table.Column isRowHeader>Nhân viên</Table.Column><Table.Column>Vai trò</Table.Column><Table.Column>Trạng thái</Table.Column><Table.Column>Ngày thêm</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header><Table.Body>{staff.map((person) => <Table.Row id={person.id} key={person.id} className="h-[68px]"><Table.Cell><p className="font-medium">{person.fullName || person.email}</p><p className="text-xs text-[var(--muted)]">{person.email}</p></Table.Cell><Table.Cell>{STAFF_ROLES[person.role] ?? person.role}</Table.Cell><Table.Cell><Chip size="sm" color={person.isActive ? "success" : "default"} variant="soft">{person.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}</Chip></Table.Cell><Table.Cell>{formatDate(person.createdAt)}</Table.Cell><Table.Cell><Button isIconOnly aria-label={`Gỡ ${person.fullName || person.email} khỏi cơ sở`} variant="tertiary" onPress={() => setStaffToRemove(person)}><TrashBin className="size-4 text-[var(--danger)]" /></Button></Table.Cell></Table.Row>)}</Table.Body></Table.Content></Table.ScrollContainer></Table></div><div className="space-y-3 md:hidden">{staff.map((person) => <Card key={person.id} className="border border-[var(--border)] bg-[var(--surface)]"><Card.Content className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{person.fullName || person.email}</p><p className="text-sm text-[var(--muted)]">{STAFF_ROLES[person.role] ?? person.role}</p></div><Button isIconOnly aria-label="Gỡ nhân viên" variant="tertiary" onPress={() => setStaffToRemove(person)}><TrashBin className="size-4 text-[var(--danger)]" /></Button></Card.Content></Card>)}</div></>}
    <Modal.Backdrop isOpen={modalOpen} onOpenChange={(open) => { if (!pending) setModalOpen(open); }}><Modal.Container size="sm"><Modal.Dialog className="sm:max-w-[480px]"><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Thêm nhân viên</Modal.Heading></Modal.Header><Modal.Body><Form id="add-staff-form" className="space-y-4" onSubmit={add}><TextField isRequired name="email" type="email"><Label>Email tài khoản</Label><Input placeholder="staff@example.com" /><FieldError /></TextField><Select isRequired name="role" defaultValue="Receptionist"><Label>Vai trò</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{Object.entries(STAFF_ROLES).map(([id, label]) => <ListBox.Item id={id} key={id} textValue={label}>{label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover><FieldError /></Select></Form></Modal.Body><Modal.Footer><Button variant="tertiary" onPress={() => setModalOpen(false)} isDisabled={pending}>Hủy</Button><Button form="add-staff-form" type="submit" variant="primary" isPending={pending}>Thêm nhân viên</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    <AlertDialog.Backdrop isOpen={!!staffToRemove} onOpenChange={(open) => { if (!open && !pending) setStaffToRemove(null); }}><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Gỡ nhân viên khỏi cơ sở?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>{staffToRemove?.fullName || staffToRemove?.email} sẽ không còn quyền vận hành cơ sở này.</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary" isDisabled={pending}>Hủy</Button><Button variant="danger" isPending={pending} onPress={() => void remove()}>Gỡ khỏi cơ sở</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop>
  </div>;
}
