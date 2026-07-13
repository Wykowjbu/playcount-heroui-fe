"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Spinner,
  Chip,
  Avatar,
  Select,
  Label,
  ListBox,
  Modal,
  TextField,
  Input,
} from "@heroui/react";
import type { Key } from "@heroui/react";

import Check from "@gravity-ui/icons/Check";
import Xmark from "@gravity-ui/icons/Xmark";
import PersonGear from "@gravity-ui/icons/PersonGear";

import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCourtOwners, updateOwnerVerification } from "@/lib/api/admin";
import type { CourtOwnerDetailDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const STATUS_OPTIONS = [
  { key: "", label: "Tất cả" },
  { key: "Pending", label: "Chờ xác minh" },
  { key: "Approved", label: "Đã xác minh" },
  { key: "Rejected", label: "Bị từ chối" },
];

export default function AdminCourtOwnersPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <CourtOwnersContent />
      </AdminShell>
    </AdminGuard>
  );
}

function CourtOwnersContent() {
  const [owners, setOwners] = useState<CourtOwnerDetailDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<Key | null>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<CourtOwnerDetailDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function loadOwners(status?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourtOwners(status || undefined);
      setOwners(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const statusVal = statusFilter != null && statusFilter !== "" ? String(statusFilter) : undefined;
    loadOwners(statusVal);
  }, [statusFilter]);

  async function handleApprove(ownerId: number) {
    setActionLoading(ownerId);
    try {
      await updateOwnerVerification(ownerId, { status: "Approved" });
      const statusVal = statusFilter != null && statusFilter !== "" ? String(statusFilter) : undefined;
      loadOwners(statusVal);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  }

  function openRejectModal(owner: CourtOwnerDetailDto) {
    setSelectedOwner(owner);
    setRejectReason("");
    setModalOpen(true);
  }

  async function handleReject() {
    if (!selectedOwner) return;
    setActionLoading(selectedOwner.id);
    try {
      await updateOwnerVerification(selectedOwner.id, { status: "Rejected", rejectionReason: rejectReason || undefined });
      const statusVal = statusFilter != null && statusFilter !== "" ? String(statusFilter) : undefined;
      loadOwners(statusVal);
      setModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xác minh chủ sân</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Quản lý hồ sơ chủ sân</p>
      </div>

      <Select
        placeholder="Tất cả"
        selectedKey={statusFilter}
        onSelectionChange={(key) => setStatusFilter(key)}
        className="w-52"
        aria-label="Lọc theo trạng thái"
      >
        <Label>Trạng thái</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={STATUS_OPTIONS}>
            {(item) => (
              <ListBox.Item key={item.key} id={item.key} textValue={item.label}>
                {item.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </Select.Popover>
      </Select>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center"><p className="text-[var(--danger)]">{error}</p></div>
      ) : owners.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <PersonGear className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)]">Không có hồ sơ nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {owners.map((o) => {
            const cfg = getStatusConfig("ownerVerification", o.verificationStatus);
            return (
              <Card key={o.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar size="md">
                        <Avatar.Fallback>{o.fullName?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() || "?"}</Avatar.Fallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{o.fullName}</p>
                          <Chip size="sm" color={cfg.color} variant="soft">{cfg.label}</Chip>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{o.email}</p>
                        <p className="text-sm text-[var(--muted)]">{o.businessName} · {o.phoneNumber} · {o.venueCount} cơ sở</p>
                        <p className="text-xs text-[var(--muted)] mt-1">Đăng ký: {formatDate(o.createdAt)}</p>
                        {o.rejectionReason && <p className="text-xs text-[var(--danger)] mt-1">Lý do từ chối: {o.rejectionReason}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {o.verificationStatus === "Pending" && (
                        <>
                          <Button variant="primary" size="sm" isDisabled={actionLoading === o.id} onPress={() => handleApprove(o.id)}>
                            {actionLoading === o.id ? <Spinner size="sm" /> : "Duyệt"}
                          </Button>
                          <Button variant="danger" size="sm" isDisabled={actionLoading === o.id} onPress={() => openRejectModal(o)}>
                            Từ chối
                          </Button>
                        </>
                      )}
                      {o.verificationStatus === "Rejected" && (
                        <Button variant="primary" size="sm" isDisabled={actionLoading === o.id} onPress={() => handleApprove(o.id)}>
                          {actionLoading === o.id ? <Spinner size="sm" /> : "Duyệt lại"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Từ chối hồ sơ</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-[var(--muted)] mb-2">{selectedOwner?.fullName} — {selectedOwner?.businessName}</p>
                <TextField value={rejectReason} onChange={(v) => setRejectReason(String(v))} aria-label="Lý do từ chối">
                  <Label>Lý do từ chối</Label>
                  <Input placeholder="Nhập lý do..." />
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" slot="close" isDisabled={actionLoading !== null}>Hủy</Button>
                <Button variant="danger" isDisabled={actionLoading !== null} onPress={handleReject}>
                  {actionLoading !== null ? <Spinner size="sm" className="mr-2" /> : null}
                  Từ chối
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
