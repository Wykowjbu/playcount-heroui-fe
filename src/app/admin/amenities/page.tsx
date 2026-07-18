"use client";

import { useEffect, useState } from "react";
import { Alert, Button, EmptyState, Input, Label, Modal, Spinner, Table, TextField } from "@heroui/react";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Wrench from "@gravity-ui/icons/Wrench";
import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { createAmenity, deleteAmenity, getAllAmenitiesAdmin, updateAmenity } from "@/lib/api/admin";
import type { AmenityDto } from "@/lib/types/api";

export default function AdminAmenitiesPage() { return <AdminGuard><AdminShell><AmenitiesContent /></AdminShell></AdminGuard>; }

function AmenitiesContent() {
  const [items, setItems] = useState<AmenityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<AmenityDto | null>(null);
  const [deleting, setDeleting] = useState<AmenityDto | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [name, setName] = useState("");

  async function load() { setLoading(true); setError(null); try { setItems(await getAllAmenitiesAdmin()); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải tiện ích"); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  function openEditor(item: AmenityDto | null) { setEditing(item); setName(item?.name ?? ""); setError(null); setEditorOpen(true); }
  async function save() { if (!name.trim()) return; setPending(true); setError(null); try { if (editing) await updateAmenity(editing.id, { name: name.trim() }); else await createAmenity({ name: name.trim() }); await load(); setEditorOpen(false); } catch (e) { setError(e instanceof Error ? e.message : "Không thể lưu tiện ích"); } finally { setPending(false); } }
  async function remove() { if (!deleting) return; setPending(true); setError(null); try { await deleteAmenity(deleting.id); await load(); setDeleting(null); } catch (e) { setError(e instanceof Error ? e.message : "Không thể xóa tiện ích"); } finally { setPending(false); } }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Tiện ích</h1><p className="mt-1 text-sm text-[var(--muted)]">{items.length} tiện ích</p></div><Button onPress={() => openEditor(null)}><Plus className="size-4" />Thêm tiện ích</Button></div>
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    {loading ? <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div> : items.length === 0 ? <EmptyState className="py-12 text-center"><Wrench className="mx-auto mb-3 size-8 text-[var(--muted)]" /><p className="font-medium">Chưa có tiện ích</p></EmptyState> :
      <Table aria-label="Danh sách tiện ích"><Table.ScrollContainer><Table.Content>
        <Table.Header><Table.Column isRowHeader>Tên</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header>
        <Table.Body items={items}>{(item) => <Table.Row id={item.id}><Table.Cell className="font-medium">{item.name}</Table.Cell><Table.Cell><div className="flex gap-1"><Button isIconOnly size="sm" variant="ghost" aria-label={`Sửa ${item.name}`} onPress={() => openEditor(item)}><Pencil className="size-4" /></Button><Button isIconOnly size="sm" variant="ghost" className="text-[var(--danger)]" aria-label={`Xóa ${item.name}`} onPress={() => setDeleting(item)}><TrashBin className="size-4" /></Button></div></Table.Cell></Table.Row>}</Table.Body>
      </Table.Content></Table.ScrollContainer></Table>}

    <Modal isOpen={editorOpen} onOpenChange={setEditorOpen}><Modal.Backdrop><Modal.Container><Modal.Dialog className="sm:max-w-md"><Modal.CloseTrigger /><Modal.Header><Modal.Heading>{editing ? "Sửa tiện ích" : "Thêm tiện ích"}</Modal.Heading></Modal.Header><Modal.Body><TextField value={name} onChange={(value) => setName(String(value))} isRequired><Label>Tên tiện ích</Label><Input placeholder="Ví dụ: Wifi miễn phí" /></TextField></Modal.Body><Modal.Footer><Button variant="ghost" onPress={() => setEditorOpen(false)} isDisabled={pending}>Hủy</Button><Button onPress={save} isDisabled={pending || !name.trim()}>{pending && <Spinner size="sm" />}Lưu</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>
    <Modal isOpen={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }}><Modal.Backdrop><Modal.Container><Modal.Dialog className="sm:max-w-sm"><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Xóa tiện ích</Modal.Heading></Modal.Header><Modal.Body><p className="text-sm">Xóa “{deleting?.name}” khỏi danh mục?</p></Modal.Body><Modal.Footer><Button variant="ghost" onPress={() => setDeleting(null)} isDisabled={pending}>Hủy</Button><Button variant="danger" onPress={remove} isDisabled={pending}>{pending && <Spinner size="sm" />}Xóa</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>
  </div>;
}
