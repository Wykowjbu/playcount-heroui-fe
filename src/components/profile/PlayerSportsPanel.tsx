"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Chip,
  Select,
  Label,
  ListBox,
  Modal,
  Alert,
} from "@heroui/react";
import Plus from "@gravity-ui/icons/Plus";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Star from "@gravity-ui/icons/Star";
import { useAuth } from "@/lib/auth-context";
import {
  getMySports,
  addMySport,
  updateMySport,
  deleteMySport,
  getSportsOptions,
} from "@/lib/api/profile";
import type {
  PlayerSportResponseDto,
  SportOption,
} from "@/lib/types/profile";
import { SKILL_LEVEL_OPTIONS, SKILL_LEVEL_BE_TO_LABEL } from "@/lib/types/profile";

export function PlayerSportsPanel() {
  const { user } = useAuth();
  const [sports, setSports] = useState<PlayerSportResponseDto[]>([]);
  const [options, setOptions] = useState<SportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addSportId, setAddSportId] = useState<string>("");
  const [addSkill, setAddSkill] = useState<string>("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal state
  const [editSport, setEditSport] = useState<PlayerSportResponseDto | null>(null);
  const [editSkill, setEditSkill] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [mySports, allOptions] = await Promise.all([
        getMySports(user.accessToken),
        getSportsOptions(user.accessToken).catch(() => [] as SportOption[]),
      ]);
      setSports(mySports);
      setOptions(allOptions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách môn thể thao");
    } finally {
      setLoading(false);
    }
  }, [user?.accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  // Available sports (exclude already added)
  const addedSportIds = new Set(sports.map((s) => s.sportId));
  const availableOptions = options.filter((o) => !addedSportIds.has(o.sportId));

  // Skill level chip color
  function skillColor(level: string): "success" | "warning" | "accent" {
    if (level === "Advanced") return "success";
    if (level === "Intermediate") return "warning";
    return "accent";
  }

  async function handleAdd() {
    if (!user?.accessToken || !addSportId || !addSkill) return;
    setAddSaving(true);
    setAddError(null);
    try {
      await addMySport(user.accessToken, {
        sportId: Number(addSportId),
        skillLevel: Number(addSkill),
      });
      setAddOpen(false);
      setAddSportId("");
      setAddSkill("");
      await loadData();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Thêm môn thể thao thất bại");
    } finally {
      setAddSaving(false);
    }
  }

  async function handleEdit() {
    if (!user?.accessToken || !editSport) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateMySport(user.accessToken, editSport.sportId, {
        skillLevel: Number(editSkill),
      });
      setEditSport(null);
      setEditSkill("");
      await loadData();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Cập nhật thất bại");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(sportId: number) {
    if (!user?.accessToken) return;
    if (!confirm("Xóa môn thể thao này?")) return;
    try {
      await deleteMySport(user.accessToken, sportId);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Xóa thất bại");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            <div className="h-4 w-1/3 rounded-lg" style={{ background: "var(--surface-secondary)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-foreground">Môn thể thao</h3>
          <p className="text-xs text-muted mt-0.5">Các môn bạn thường chơi</p>
        </div>
        <Button variant="primary" size="sm" onPress={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Thêm môn
        </Button>
      </div>

      {/* Empty state */}
      {sports.length === 0 ? (
        <div className="py-8 text-center">
          <Star className="w-8 h-8 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted">Chưa có môn thể thao nào.</p>
          <Button variant="outline" size="sm" className="mt-3" onPress={() => setAddOpen(true)}>
            Thêm môn thể thao
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{ background: "var(--surface-secondary)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Star className="w-4 h-4 text-muted shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">{sport.sportName}</span>
                  <span className="text-xs text-muted">
                    Kỹ năng:{" "}
                    <Chip color={skillColor(sport.skillLevel)} size="sm" className="ml-0.5">
                      {SKILL_LEVEL_BE_TO_LABEL[sport.skillLevel] ?? sport.skillLevel}
                    </Chip>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Sửa ${sport.sportName}`}
                  onPress={() => {
                    setEditSport(sport);
                    // Map BE skill level string to numeric
                    const levelMap: Record<string, string> = { Beginner: "0", Intermediate: "1", Advanced: "2" };
                    setEditSkill(levelMap[sport.skillLevel] ?? "0");
                    setEditError(null);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Xóa ${sport.sportName}`}
                  className="text-danger"
                  onPress={() => handleDelete(sport.sportId)}
                >
                  <TrashBin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal>
        <Modal.Backdrop isOpen={addOpen} onOpenChange={setAddOpen}>
          <Modal.Container size="sm" placement="center">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Thêm môn thể thao</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {addError && (
                  <Alert status="danger" className="mb-3">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{addError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                <Select
                  className="w-full mb-3"
                  placeholder="Chọn môn thể thao"
                  selectedKey={addSportId || undefined}
                  onSelectionChange={(key) => setAddSportId(key != null ? String(key) : "")}
                >
                  <Label>Môn thể thao</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {availableOptions.map((opt) => (
                        <ListBox.Item key={String(opt.sportId)} id={String(opt.sportId)} textValue={opt.sportName}>
                          {opt.sportName}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                      {availableOptions.length === 0 && (
                        <ListBox.Item id="__empty" textValue="Đã thêm tất cả" isDisabled>
                          Đã thêm tất cả môn
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  className="w-full"
                  placeholder="Chọn trình độ"
                  selectedKey={addSkill || undefined}
                  onSelectionChange={(key) => setAddSkill(key != null ? String(key) : "")}
                >
                  <Label>Trình độ</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {SKILL_LEVEL_OPTIONS.map((opt) => (
                        <ListBox.Item key={String(opt.value)} id={String(opt.value)} textValue={opt.label}>
                          {opt.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">Hủy</Button>
                <Button
                  variant="primary"
                  isPending={addSaving}
                  isDisabled={!addSportId || !addSkill}
                  onPress={handleAdd}
                >
                  {addSaving ? "Đang thêm..." : "Thêm"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Edit Modal */}
      <Modal>
        <Modal.Backdrop isOpen={!!editSport} onOpenChange={(open) => { if (!open) setEditSport(null); }}>
          <Modal.Container size="sm" placement="center">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Sửa {editSport?.sportName}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {editError && (
                  <Alert status="danger" className="mb-3">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{editError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                <Select
                  className="w-full"
                  placeholder="Chọn trình độ"
                  selectedKey={editSkill || undefined}
                  onSelectionChange={(key) => setEditSkill(key != null ? String(key) : "")}
                >
                  <Label>Trình độ</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {SKILL_LEVEL_OPTIONS.map((opt) => (
                        <ListBox.Item key={String(opt.value)} id={String(opt.value)} textValue={opt.label}>
                          {opt.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" variant="secondary">Hủy</Button>
                <Button
                  variant="primary"
                  isPending={editSaving}
                  onPress={handleEdit}
                >
                  {editSaving ? "Đang lưu..." : "Lưu"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
