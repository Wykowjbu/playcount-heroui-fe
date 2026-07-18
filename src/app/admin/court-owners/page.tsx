"use client";

import { useCallback, useEffect, useState } from "react";
import type { Key } from "@heroui/react";
import { Alert, Avatar, Button, Chip, EmptyState, Input, Label, ListBox, Modal, Select, Spinner, Table, TextField } from "@heroui/react";
import Eye from "@gravity-ui/icons/Eye";
import PersonGear from "@gravity-ui/icons/PersonGear";
import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCourtOwnerById, getCourtOwners, updateOwnerVerification } from "@/lib/api/admin";
import type { CourtOwnerDetailDto, CourtOwnerListItemDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const STATUS_OPTIONS = [{ key: "", label: "Tất cả" }, { key: "Pending", label: "Chờ xác minh" }, { key: "Approved", label: "Đã xác minh" }, { key: "Rejected", label: "Bị từ chối" }];

export default function AdminCourtOwnersPage() { return <AdminGuard><AdminShell><CourtOwnersContent /></AdminShell></AdminGuard>; }

function CourtOwnersContent() {
  const [owners, setOwners] = useState<CourtOwnerListItemDto[]>([]);
  const [filter, setFilter] = useState<Key | null>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CourtOwnerDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => { setLoading(true); setError(null); try { setOwners(await getCourtOwners(filter ? String(filter) : undefined)); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải hồ sơ"); } finally { setLoading(false); } }, [filter]);
  useEffect(() => { void load(); }, [load]);
  async function review(id: number) { setDetailLoading(true); setError(null); try { setSelected(await getCourtOwnerById(id)); setRejecting(false); setReason(""); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải chi tiết hồ sơ"); } finally { setDetailLoading(false); } }
  async function update(verificationStatus: 1 | 2) { if (!selected) return; if (verificationStatus === 2 && !reason.trim()) return; setPending(true); setError(null); try { await updateOwnerVerification(selected.id, { verificationStatus, rejectionReason: verificationStatus === 2 ? reason.trim() : undefined }); setSelected(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Không thể cập nhật hồ sơ"); } finally { setPending(false); } }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">Xác minh chủ sân</h1><p className="mt-1 text-sm text-[var(--muted)]">{owners.length} hồ sơ</p></div><Select selectedKey={filter} onSelectionChange={setFilter} className="w-52" aria-label="Lọc theo trạng thái"><Label>Trạng thái</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox items={STATUS_OPTIONS}>{(item) => <ListBox.Item id={item.key} textValue={item.label}>{item.label}<ListBox.ItemIndicator /></ListBox.Item>}</ListBox></Select.Popover></Select></div>
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    {loading ? <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div> : owners.length === 0 ? <EmptyState className="py-12 text-center"><PersonGear className="mx-auto mb-3 size-8 text-[var(--muted)]" /><p className="font-medium">Không có hồ sơ</p></EmptyState> :
      <Table aria-label="Danh sách hồ sơ chủ sân"><Table.ScrollContainer><Table.Content>
        <Table.Header><Table.Column isRowHeader>Chủ sân</Table.Column><Table.Column>Doanh nghiệp</Table.Column><Table.Column>Liên hệ</Table.Column><Table.Column>Trạng thái</Table.Column><Table.Column>Ngày đăng ký</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header>
        <Table.Body items={owners}>{(owner) => { const status = getStatusConfig("ownerVerification", owner.verificationStatus); return <Table.Row id={owner.id}>
          <Table.Cell><div className="flex items-center gap-3"><Avatar size="sm"><Avatar.Fallback>{initials(owner.fullName)}</Avatar.Fallback></Avatar><div><p className="font-medium">{owner.fullName}</p><p className="text-xs text-[var(--muted)]">{owner.email}</p></div></div></Table.Cell>
          <Table.Cell>{owner.businessName || "—"}</Table.Cell><Table.Cell>{owner.phone || "—"}</Table.Cell><Table.Cell><Chip size="sm" color={status.color} variant="soft">{status.label}</Chip></Table.Cell><Table.Cell>{formatDate(owner.createdAt)}</Table.Cell>
          <Table.Cell><Button size="sm" variant="ghost" isDisabled={detailLoading} onPress={() => review(owner.id)}><Eye className="size-4" />Xem hồ sơ</Button></Table.Cell>
        </Table.Row>; }}</Table.Body>
      </Table.Content></Table.ScrollContainer></Table>}

    <Modal isOpen={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}><Modal.Backdrop><Modal.Container><Modal.Dialog className="sm:max-w-xl"><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Hồ sơ chủ sân</Modal.Heading></Modal.Header><Modal.Body>{selected && <div className="space-y-4"><div className="grid gap-2 text-sm sm:grid-cols-2"><Info label="Họ tên" value={selected.fullName} /><Info label="Email" value={selected.email} /><Info label="Điện thoại" value={selected.phone} /><Info label="Doanh nghiệp" value={selected.businessName} /><Info label="Giấy phép kinh doanh" value={selected.businessLicenseNo} /><Info label="Mã số thuế" value={selected.taxCode} /><Info label="Địa chỉ kinh doanh" value={selected.businessAddress} /><Info label="Đăng ký" value={formatDate(selected.createdAt)} /></div>{selected.rejectionReason && <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Description>Lý do từ chối trước đó: {selected.rejectionReason}</Alert.Description></Alert.Content></Alert>}{rejecting && <TextField value={reason} onChange={(value) => setReason(String(value))} isRequired><Label>Lý do từ chối</Label><Input placeholder="Nêu lý do để chủ sân có thể bổ sung hồ sơ" /></TextField>}</div>}</Modal.Body><Modal.Footer><Button variant="ghost" onPress={() => setSelected(null)} isDisabled={pending}>Đóng</Button>{selected?.verificationStatus !== "Approved" && <Button onPress={() => update(1)} isDisabled={pending}>{pending && <Spinner size="sm" />}Duyệt</Button>}{selected?.verificationStatus === "Pending" && (!rejecting ? <Button variant="danger" onPress={() => setRejecting(true)} isDisabled={pending}>Từ chối</Button> : <Button variant="danger" onPress={() => update(2)} isDisabled={pending || !reason.trim()}>{pending && <Spinner size="sm" />}Xác nhận từ chối</Button>)}</Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>
  </div>;
}

function initials(name: string) { return name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?"; }
function Info({ label, value }: { label: string; value: string | null }) { return <div><p className="text-xs text-[var(--muted)]">{label}</p><p className="font-medium">{value || "—"}</p></div>; }
