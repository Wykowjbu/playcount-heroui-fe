"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Spinner,
  Table,
  Modal,
  TextField,
  Input,
  Label,
  Form,
} from "@heroui/react";

import Plus from "@gravity-ui/icons/Plus";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Wrench from "@gravity-ui/icons/Wrench";

import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllAmenitiesAdmin, createAmenity, updateAmenity, deleteAmenity } from "@/lib/api/admin";
import type { AmenityDto, CreateAmenityRequestDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";

export default function AdminAmenitiesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AmenitiesContent />
      </AdminShell>
    </AdminGuard>
  );
}

function AmenitiesContent() {
  const [amenities, setAmenities] = useState<AmenityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AmenityDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  async function loadAmenities() {
    setLoading(true);
    try {
      const data = await getAllAmenitiesAdmin();
      setAmenities(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAmenities(); }, []);

  function openCreate() {
    setEditingAmenity(null);
    setFormName("");
    setFormDesc("");
    setModalOpen(true);
  }

  function openEdit(amenity: AmenityDto) {
    setEditingAmenity(amenity);
    setFormName(amenity.name);
    setFormDesc(amenity.description ?? "");
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!formName.trim()) return;
    setActionLoading(true);
    try {
      const body: CreateAmenityRequestDto = { name: formName.trim(), description: formDesc.trim() || undefined };
      if (editingAmenity) {
        await updateAmenity(editingAmenity.id, body);
      } else {
        await createAmenity(body);
      }
      await loadAmenities();
      setModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteAmenity(deleteTarget.id);
      await loadAmenities();
      setDeleteModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tiện ích</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{amenities.length} tiện ích</p>
        </div>
        <Button variant="primary" onPress={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm tiện ích
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center"><p className="text-[var(--danger)]">{error}</p></div>
      ) : amenities.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <Wrench className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)]">Chưa có tiện ích nào</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-0">
            <Table aria-label="Danh sách tiện ích">
              <Table.Content>
                <Table.Header>
                  <Table.Column>ID</Table.Column>
                  <Table.Column>Tên</Table.Column>
                  <Table.Column>Mô tả</Table.Column>
                  <Table.Column>Ngày tạo</Table.Column>
                  <Table.Column>Thao tác</Table.Column>
                </Table.Header>
                <Table.Body items={amenities}>
                  {(item) => (
                    <Table.Row>
                      <Table.Cell>{item.id}</Table.Cell>
                      <Table.Cell className="font-medium">{item.name}</Table.Cell>
                      <Table.Cell className="text-[var(--muted)]">{item.description ?? "—"}</Table.Cell>
                      <Table.Cell>{formatDate(item.createdAt)}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Sửa" onPress={() => openEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Xóa" className="text-[var(--danger)]" onPress={() => { setDeleteTarget(item); setDeleteModalOpen(true); }}>
                            <TrashBin className="w-4 h-4" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editingAmenity ? "Sửa tiện ích" : "Thêm tiện ích"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-4">
                  <TextField value={formName} onChange={(v) => setFormName(String(v))} isRequired aria-label="Tên tiện ích">
                    <Label>Tên tiện ích</Label>
                    <Input placeholder="VD: Wifi miễn phí" />
                  </TextField>
                  <TextField value={formDesc} onChange={(v) => setFormDesc(String(v))} aria-label="Mô tả">
                    <Label>Mô tả</Label>
                    <Input placeholder="Mô tả tùy chọn" />
                  </TextField>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" slot="close" isDisabled={actionLoading}>Hủy</Button>
                <Button variant="primary" isDisabled={actionLoading || !formName.trim()} onPress={handleSubmit}>
                  {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  {editingAmenity ? "Lưu" : "Tạo"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-sm">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Xóa tiện ích</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm">Bạn có chắc muốn xóa <strong>{deleteTarget?.name}</strong>?</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" slot="close" isDisabled={actionLoading}>Hủy</Button>
                <Button variant="danger" isDisabled={actionLoading} onPress={handleDelete}>
                  {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Xóa
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
