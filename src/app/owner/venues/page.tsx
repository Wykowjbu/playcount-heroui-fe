"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDialog, Avatar, Button, Card, Dropdown, Skeleton, Table } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import Ellipsis from "@gravity-ui/icons/Ellipsis";
import Eye from "@gravity-ui/icons/Eye";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerButtonLink, OwnerEmptyState, OwnerPageHeader, OwnerStatusChip } from "@/components/owner/owner-ui";
import { deleteVenue, getMyVenues } from "@/lib/api/owner";
import type { VenueResponseDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";

export default function OwnerVenuesPage() { return <OwnerGuard><OwnerShell activeItem="venues"><VenuesContent /></OwnerShell></OwnerGuard>; }

function VenuesContent() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [venueToDelete, setVenueToDelete] = useState<VenueResponseDto | null>(null);

  async function load() { setLoading(true); setError(null); try { setVenues(await getMyVenues()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải danh sách cơ sở."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function remove(venueId: number) { setDeleting(venueId); try { await deleteVenue(venueId); setVenues((items) => items.filter((venue) => venue.id !== venueId)); } catch { /* apiFetch shows the toast. */ } finally { setDeleting(null); } }

  return <div className="mx-auto max-w-[1440px] space-y-6">
    <OwnerPageHeader title="Cơ sở của tôi" description={loading ? "Đang tải cơ sở..." : `${venues.length} cơ sở`} action={<OwnerButtonLink href="/owner/venues/new"><Plus className="mr-1.5 size-4" />Tạo cơ sở</OwnerButtonLink>} />
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Không thể hoàn tất thao tác</Alert.Title><Alert.Description>{error}</Alert.Description><Button size="sm" variant="tertiary" onPress={() => void load()}>Thử lại</Button></Alert.Content></Alert>}
    {loading ? <VenueSkeleton /> : venues.length === 0 ? <OwnerEmptyState title="Bạn chưa có cơ sở nào" description="Tạo cơ sở đầu tiên để thêm sân và nhận đặt chỗ." icon={MapPin} action={<OwnerButtonLink href="/owner/venues/new">Tạo cơ sở</OwnerButtonLink>} /> : <><div className="hidden md:block"><VenueTable venues={venues} deleting={deleting} onDeleteRequest={setVenueToDelete} /></div><div className="grid gap-3 md:hidden">{venues.map((venue) => <VenueCard key={venue.id} venue={venue} deleting={deleting === venue.id} onDeleteRequest={setVenueToDelete} />)}</div></>}
    <AlertDialog.Backdrop isOpen={venueToDelete !== null} onOpenChange={(open) => { if (!open) setVenueToDelete(null); }}><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Heading>Xóa cơ sở?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>{venueToDelete ? `“${venueToDelete.name}” sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.` : "Thao tác này không thể hoàn tác."}</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary">Hủy</Button><Button slot="close" variant="danger" onPress={() => { if (venueToDelete) void remove(venueToDelete.id).then(() => setVenueToDelete(null)); }} isPending={deleting !== null}>Xóa cơ sở</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop>
  </div>;
}

function VenueTable({ venues, deleting, onDeleteRequest }: { venues: VenueResponseDto[]; deleting: number | null; onDeleteRequest: (venue: VenueResponseDto) => void }) {
  return <Table><Table.ScrollContainer><Table.Content aria-label="Danh sách cơ sở"><Table.Header><Table.Column isRowHeader>Cơ sở</Table.Column><Table.Column>Trạng thái</Table.Column><Table.Column>Ngày tạo</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header><Table.Body>{venues.map((venue) => <Table.Row id={venue.id} key={venue.id}><Table.Cell><VenueIdentity venue={venue} /></Table.Cell><Table.Cell><OwnerStatusChip kind="venue" status={venue.status} /></Table.Cell><Table.Cell>{formatDate(venue.createdAt)}</Table.Cell><Table.Cell><VenueActions venue={venue} disabled={deleting === venue.id} onDeleteRequest={onDeleteRequest} /></Table.Cell></Table.Row>)}</Table.Body></Table.Content></Table.ScrollContainer></Table>;
}

function VenueCard({ venue, deleting, onDeleteRequest }: { venue: VenueResponseDto; deleting: boolean; onDeleteRequest: (venue: VenueResponseDto) => void }) { return <Card className="border border-[var(--border)] bg-[var(--surface)]"><Card.Content className="space-y-4 p-4"><div className="flex items-start gap-3"><VenueIdentity venue={venue} /><OwnerStatusChip kind="venue" status={venue.status} /></div><p className="text-xs text-[var(--muted)]">Tạo {formatDate(venue.createdAt)}</p><div className="flex items-center justify-between"><OwnerButtonLink href={`/owner/venues/${venue.id}`} size="sm" variant="tertiary">Xem chi tiết</OwnerButtonLink><VenueActions venue={venue} disabled={deleting} onDeleteRequest={onDeleteRequest} /></div></Card.Content></Card>; }

function VenueIdentity({ venue }: { venue: VenueResponseDto }) { const cover = venue.images.find((image) => image.isCover) ?? venue.images[0]; return <div className="flex min-w-0 items-center gap-3"><Avatar className="size-12 shrink-0 rounded-xl">{cover && <Avatar.Image src={cover.imageUrl} alt={`Ảnh ${venue.name}`} />}<Avatar.Fallback className="rounded-xl"><MapPin className="size-5 text-[var(--muted)]" /></Avatar.Fallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-semibold">{venue.name}</p><p className="truncate text-xs text-[var(--muted)]">{venue.address}</p></div></div>; }

function VenueActions({ venue, disabled, onDeleteRequest }: { venue: VenueResponseDto; disabled: boolean; onDeleteRequest: (venue: VenueResponseDto) => void }) { return <Dropdown><Button isIconOnly size="sm" variant="tertiary" aria-label={`Thao tác với ${venue.name}`} isDisabled={disabled}><Ellipsis className="size-5" /></Button><Dropdown.Popover><Dropdown.Menu aria-label={`Thao tác với ${venue.name}`} onAction={(key) => { if (key === "delete") onDeleteRequest(venue); }}><Dropdown.Item id="view" textValue="Xem chi tiết" href={`/owner/venues/${venue.id}`}><Eye className="size-4" />Xem chi tiết</Dropdown.Item><Dropdown.Item id="edit" textValue="Chỉnh sửa" href={`/owner/venues/${venue.id}/edit`}><Pencil className="size-4" />Chỉnh sửa</Dropdown.Item><Dropdown.Item id="delete" textValue="Xóa cơ sở" variant="danger"><TrashBin className="size-4" />Xóa cơ sở</Dropdown.Item></Dropdown.Menu></Dropdown.Popover></Dropdown>; }

function VenueSkeleton() { return <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-16 rounded-xl" key={index} />)}</div>; }
