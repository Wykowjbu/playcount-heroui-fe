"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Spinner,
  Chip,
  Table,
  Modal,
  TextField,
  Input,
  Label,
  Alert,
} from "@heroui/react";

import Plus from "@gravity-ui/icons/Plus";
import Pencil from "@gravity-ui/icons/Pencil";
import Tags from "@gravity-ui/icons/Tags";

import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllSportsAdmin, createSport, updateSport, toggleSportActive } from "@/lib/api/admin";
import type { SportDto, CreateSportRequestDto, UpdateSportRequestDto } from "@/lib/types/api";

export default function AdminSportsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <SportsContent />
      </AdminShell>
    </AdminGuard>
  );
}

function SportsContent() {
  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  const [editingSport, setEditingSport] = useState<SportDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  async function loadSports() {
    setLoading(true);
    try {
      const data = await getAllSportsAdmin();
      setSports(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSports(); }, []);

  function openCreate() {
    setEditingSport(null);
    setFormCode("");
    setFormName("");
    setFormDesc("");
    setModalOpen(true);
  }

  function openEdit(sport: SportDto) {
    setEditingSport(sport);
    setFormCode(sport.code);
    setFormName(sport.name);
    setFormDesc(sport.description ?? "");
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!formName.trim() || !formCode.trim()) return;
    setActionLoading(true); setError(null);
    try {
      if (editingSport) {
        const body: UpdateSportRequestDto = { name: formName.trim(), code: formCode.trim(), description: formDesc.trim() || undefined };
        await updateSport(editingSport.id, body);
      } else {
        const body: CreateSportRequestDto = { name: formName.trim(), code: formCode.trim(), description: formDesc.trim() || undefined };
        await createSport(body);
      }
      await loadSports();
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggle(id: number) {
    setToggleLoading(id); setError(null);
    try {
      await toggleSportActive(id);
      await loadSports();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setToggleLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Môn thể thao</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{sports.length} môn · {sports.filter((s) => s.isActive).length} đang hoạt động</p>
        </div>
        <Button variant="primary" onPress={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm môn thể thao
        </Button>
      </div>

      {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : sports.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <Tags className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)]">Chưa có môn thể thao nào</p>
          </CardContent>
        </Card>
      ) : (
            <Table aria-label="Danh sách môn thể thao">
              <Table.ScrollContainer><Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Mã</Table.Column>
                  <Table.Column>Tên</Table.Column>
                  <Table.Column>Mô tả</Table.Column>
                  <Table.Column>Trạng thái</Table.Column>
                  <Table.Column>Thao tác</Table.Column>
                </Table.Header>
                <Table.Body items={sports}>
                  {(item) => (
                    <Table.Row id={item.id}>
                      <Table.Cell className="font-mono text-xs">{item.code}</Table.Cell>
                      <Table.Cell className="font-medium">{item.name}</Table.Cell>
                      <Table.Cell className="text-[var(--muted)]">{item.description ?? "—"}</Table.Cell>
                      <Table.Cell>
                        <Chip size="sm" color={item.isActive ? "success" : "default"} variant="soft">
                          {item.isActive ? "Hoạt động" : "Ngưng"}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Sửa" onPress={() => openEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" isDisabled={toggleLoading === item.id} onPress={() => handleToggle(item.id)}>
                            {toggleLoading === item.id ? <Spinner size="sm" /> : item.isActive ? "Ngưng" : "Kích hoạt"}
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content></Table.ScrollContainer>
            </Table>
      )}

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editingSport ? "Sửa môn thể thao" : "Thêm môn thể thao"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-4">
                  <TextField value={formCode} onChange={(v) => setFormCode(String(v))} isRequired aria-label="Mã (code)">
                    <Label>Mã (code)</Label>
                    <Input placeholder="VD: badminton" />
                  </TextField>
                  <TextField value={formName} onChange={(v) => setFormName(String(v))} isRequired aria-label="Tên môn">
                    <Label>Tên môn</Label>
                    <Input placeholder="VD: Cầu lông" />
                  </TextField>
                  <TextField value={formDesc} onChange={(v) => setFormDesc(String(v))} aria-label="Mô tả">
                    <Label>Mô tả</Label>
                    <Input placeholder="Mô tả tùy chọn" />
                  </TextField>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setModalOpen(false)} isDisabled={actionLoading}>Hủy</Button>
                <Button variant="primary" isDisabled={actionLoading || !formName.trim() || !formCode.trim()} onPress={handleSubmit}>
                  {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  {editingSport ? "Lưu" : "Tạo"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
