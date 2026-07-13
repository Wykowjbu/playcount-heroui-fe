"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { Key } from "@react-types/shared";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Chip,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";

import ArrowLeft from "@gravity-ui/icons/ArrowLeft";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Clock from "@gravity-ui/icons/Clock";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import {
  getMyVenueById,
  getCourts,
  deleteCourt,
  addVenueAmenity,
  removeVenueAmenity,
  deleteVenueImage,
  setCoverImage,
  updateOpeningHours,
  addStaff,
  getVenueStaff,
  removeStaff,
} from "@/lib/api/owner";
import { getAllAmenities } from "@/lib/api/discovery";
import type {
  VenueResponseDto,
  CourtDto,
  OpeningHourDto,
  AmenityDto,
  VenueStaffResponseDto,
} from "@/lib/types/api";
import { formatVnd, formatDate, formatTime } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const DAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

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
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<Key>("overview");

  async function loadVenue() {
    try {
      const [v, c] = await Promise.all([
        getMyVenueById(venueId),
        getCourts(venueId),
      ]);
      setVenue(v);
      setCourts(c);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVenue();
  }, [venueId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--danger)]">{error ?? "Không tìm thấy cơ sở"}</p>
      </div>
    );
  }

  const venueCfg = getStatusConfig("venue", venue.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner/venues">
            <Button isIconOnly variant="ghost" aria-label="Quay lại">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <Chip size="sm" color={venueCfg.color} variant="soft">
                {venueCfg.label}
              </Chip>
            </div>
            <p className="text-sm text-[var(--muted)] mt-0.5">{venue.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/owner/venues/${venueId}/edit`}>
            <Button variant="ghost">
              <Pencil className="w-4 h-4 mr-1.5" />
              Sửa
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        aria-label="Venue tabs"
      >
        <TabList>
          <Tab id="overview">Tổng quan</Tab>
          <Tab id="courts">Sân ({courts.length})</Tab>
          <Tab id="hours">Giờ mở cửa</Tab>
          <Tab id="amenities">Tiện ích</Tab>
          <Tab id="images">Hình ảnh</Tab>
          <Tab id="staff">Nhân viên</Tab>
        </TabList>

        <TabPanel id="overview">
          <OverviewTab venue={venue} courts={courts} />
        </TabPanel>

        <TabPanel id="courts">
          <CourtsTab venueId={venueId} courts={courts} onRefresh={loadVenue} />
        </TabPanel>

        <TabPanel id="hours">
          <OpeningHoursTab venueId={venueId} hours={venue.openingHours} onRefresh={loadVenue} />
        </TabPanel>

        <TabPanel id="amenities">
          <AmenitiesTab venue={venue} onRefresh={loadVenue} />
        </TabPanel>

        <TabPanel id="images">
          <ImagesTab venue={venue} onRefresh={loadVenue} />
        </TabPanel>

        <TabPanel id="staff">
          <StaffTab venueId={venueId} />
        </TabPanel>
      </Tabs>
    </div>
  );
}

function StaffTab({ venueId }: { venueId: number }) {
  const [staff, setStaff] = useState<VenueStaffResponseDto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setStaff(await getVenueStaff(venueId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể tải nhân viên"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [venueId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await addStaff(venueId, { email: String(data.get("email")), role: String(data.get("role")) });
      event.currentTarget.reset();
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể thêm nhân viên"); }
  }

  if (loading) return <div className="flex h-32 items-center justify-center"><Spinner /></div>;

  return <div className="mt-4 space-y-4">
    {error && <p className="text-sm text-danger">{error}</p>}
    <Card><CardContent className="p-5"><Form className="grid gap-4 md:grid-cols-[1fr_220px_auto]" onSubmit={submit}>
      <TextField isRequired name="email" type="email"><Label>Email tài khoản</Label><Input placeholder="staff@example.com" /><FieldError /></TextField>
      <Select isRequired name="role" defaultValue="Receptionist"><Label>Vai trò</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox><ListBox.Item id="Manager" textValue="Quản lý">Quản lý<ListBox.ItemIndicator /></ListBox.Item><ListBox.Item id="Receptionist" textValue="Lễ tân">Lễ tân<ListBox.ItemIndicator /></ListBox.Item><ListBox.Item id="Accountant" textValue="Kế toán">Kế toán<ListBox.ItemIndicator /></ListBox.Item></ListBox></Select.Popover></Select>
      <Button type="submit" className="self-end">Thêm nhân viên</Button>
    </Form></CardContent></Card>
    {staff.length === 0 ? <Card><CardContent className="p-8 text-center text-muted">Chưa có nhân viên</CardContent></Card> : staff.map((person) => <Card key={person.id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-medium">{person.fullName}</p><p className="text-sm text-muted">{person.email} · {person.role}</p></div><Button isIconOnly variant="danger" aria-label="Xóa nhân viên" onPress={() => void removeStaff(venueId, person.id).then(load)}><TrashBin className="size-4" /></Button></CardContent></Card>)}
  </div>;
}

/* ---- Overview Tab ---- */
function OverviewTab({ venue, courts }: { venue: VenueResponseDto; courts: CourtDto[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-base font-semibold">Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-sm">
          <InfoRow label="Địa chỉ" value={venue.address} />
          <InfoRow label="Điện thoại" value={venue.phone ?? "—"} />
          <InfoRow label="Mô tả" value={venue.description ?? "—"} />
          <InfoRow label="Ngày tạo" value={formatDate(venue.createdAt)} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-base font-semibold">Thống kê</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-sm">
          <InfoRow label="Tổng sân" value={String(courts.length)} />
          <InfoRow
            label="Sân hoạt động"
            value={String(courts.filter((c) => c.status === "Available").length)}
          />
          <InfoRow label="Tiện ích" value={String(venue.amenities?.length ?? 0)} />
          <InfoRow label="Hình ảnh" value={String(venue.images?.length ?? 0)} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--muted)] shrink-0">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}

/* ---- Courts Tab ---- */
function CourtsTab({
  venueId,
  courts,
  onRefresh,
}: {
  venueId: number;
  courts: CourtDto[];
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(courtId: number) {
    if (!confirm("Xóa sân này?")) return;
    setDeleting(courtId);
    try {
      await deleteCourt(courtId);
      onRefresh();
    } catch {
      alert("Xóa thất bại");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh sách sân</h2>
        <Link href={`/owner/venues/${venueId}/courts/new`}>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm sân
          </Button>
        </Link>
      </div>

      {courts.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-8 text-center text-[var(--muted)]">
            Chưa có sân nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courts.map((c) => {
            const cfg = getStatusConfig("court", c.status);
            return (
              <Card
                key={c.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      <Chip size="sm" color={cfg.color} variant="soft">
                        {cfg.label}
                      </Chip>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {c.sportName} · {c.indoor ? "Trong nhà" : "Ngoài trời"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/owner/venues/${venueId}/courts/${c.id}`}>
                      <Button variant="ghost" size="sm">
                        Quản lý
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--danger)]"
                      isDisabled={deleting === c.id}
                      onPress={() => handleDelete(c.id)}
                    >
                      <TrashBin className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Opening Hours Tab ---- */
function OpeningHoursTab({
  venueId,
  hours,
  onRefresh,
}: {
  venueId: number;
  hours: OpeningHourDto[];
  onRefresh: () => void;
}) {
  const [localHours, setLocalHours] = useState<OpeningHourDto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hours?.length) {
      setLocalHours(hours);
    } else {
      setLocalHours(
        Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          openTime: "06:00",
          closeTime: "22:00",
          isClosed: false,
        }))
      );
    }
  }, [hours]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateOpeningHours(venueId, localHours);
      onRefresh();
    } catch {
      alert("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  function updateDay(index: number, field: keyof OpeningHourDto, value: string | boolean | null) {
    setLocalHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Giờ mở cửa
        </h2>
      </div>

      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardContent className="p-5 space-y-3">
          {localHours.map((h, i) => (
            <div
              key={h.dayOfWeek}
              className="flex items-center gap-4 py-2 border-b border-[var(--border)] last:border-0"
            >
              <span className="w-20 shrink-0 font-medium text-sm">
                {DAY_NAMES[h.dayOfWeek]}
              </span>
              {h.isClosed ? (
                <span className="text-sm text-[var(--muted)]">Đóng cửa</span>
              ) : (
                <div className="flex items-center gap-2">
                  <TextField aria-label={`Giờ mở cửa ${DAY_NAMES[h.dayOfWeek]}`}>
                    <Input type="time" value={h.openTime ?? "06:00"} onChange={(e) => updateDay(i, "openTime", e.target.value)} />
                  </TextField>
                  <span className="text-[var(--muted)]">—</span>
                  <TextField aria-label={`Giờ đóng cửa ${DAY_NAMES[h.dayOfWeek]}`}>
                    <Input type="time" value={h.closeTime ?? "22:00"} onChange={(e) => updateDay(i, "closeTime", e.target.value)} />
                  </TextField>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onPress={() => updateDay(i, "isClosed", !h.isClosed)}
              >
                {h.isClosed ? "Mở" : "Đóng"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="primary" onPress={handleSave} isDisabled={saving}>
        {saving ? <Spinner size="sm" className="mr-2" /> : null}
        Lưu giờ mở cửa
      </Button>
    </div>
  );
}

/* ---- Amenities Tab ---- */
function AmenitiesTab({
  venue,
  onRefresh,
}: {
  venue: VenueResponseDto;
  onRefresh: () => void;
}) {
  const [allAmenities, setAllAmenities] = useState<AmenityDto[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    getAllAmenities()
      .then((a) => setAllAmenities(a as AmenityDto[]))
      .catch(() => {})
      .finally(() => setLoadingAmenities(false));
  }, []);

  const venueAmenityIds = new Set((venue.amenities ?? []).map((a) => a.id));

  async function handleToggle(amenityId: number) {
    setActionLoading(amenityId);
    try {
      if (venueAmenityIds.has(amenityId)) {
        await removeVenueAmenity(venue.id, amenityId);
      } else {
        await addVenueAmenity(venue.id, amenityId);
      }
      onRefresh();
    } catch {
      alert("Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  }

  if (loadingAmenities) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-lg font-semibold">Tiện ích</h2>
      {allAmenities.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Chưa có tiện ích nào trong hệ thống</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allAmenities.map((a) => {
            const active = venueAmenityIds.has(a.id);
            return (
              <Card
                key={a.id}
                className={`rounded-2xl border shadow-sm cursor-pointer transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    {a.description && (
                      <p className="text-xs text-[var(--muted)] mt-0.5">{a.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={active ? "primary" : "ghost"}
                    isDisabled={actionLoading === a.id}
                    onPress={() => handleToggle(a.id)}
                  >
                    {actionLoading === a.id ? (
                      <Spinner size="sm" />
                    ) : active ? (
                      "Bỏ"
                    ) : (
                      "Thêm"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Images Tab ---- */
function ImagesTab({
  venue,
  onRefresh,
}: {
  venue: VenueResponseDto;
  onRefresh: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleAdd() {
    if (!imageUrl.trim()) return;
    setAdding(true);
    try {
      await import("@/lib/api/owner").then((m) => m.addVenueImage(venue.id, imageUrl.trim()));
      setImageUrl("");
      onRefresh();
    } catch {
      alert("Thêm ảnh thất bại");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(imageId: number) {
    if (!confirm("Xóa ảnh này?")) return;
    setDeleting(imageId);
    try {
      await deleteVenueImage(venue.id, imageId);
      onRefresh();
    } catch {
      alert("Xóa thất bại");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetCover(imageId: number) {
    try {
      await setCoverImage(venue.id, imageId);
      onRefresh();
    } catch {
      alert("Đặt ảnh bìa thất bại");
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-lg font-semibold">Hình ảnh</h2>

      {/* Add image form */}
      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardContent className="p-4 flex gap-2">
          <TextField className="flex-1" aria-label="URL hình ảnh">
            <Input type="url" placeholder="Nhập URL hình ảnh..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </TextField>
          <Button
            variant="primary"
            size="sm"
            isDisabled={!imageUrl.trim() || adding}
            onPress={handleAdd}
          >
            {adding ? <Spinner size="sm" /> : "Thêm"}
          </Button>
        </CardContent>
      </Card>

      {/* Image list */}
      {(venue.images ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Chưa có hình ảnh</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(venue.images ?? []).map((img) => (
            <div
              key={img.id}
              className="relative group rounded-2xl overflow-hidden border border-[var(--border)]"
            >
              <img
                src={img.imageUrl}
                alt=""
                className="w-full h-40 object-cover"
              />
              {img.isCover && (
                <div className="absolute top-2 left-2">
                  <Chip size="sm" color="accent">Ảnh bìa</Chip>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isCover && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white"
                    onPress={() => handleSetCover(img.id)}
                  >
                    Đặt bìa
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--danger)]"
                  isDisabled={deleting === img.id}
                  onPress={() => handleDelete(img.id)}
                >
                  <TrashBin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
