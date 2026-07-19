"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Alert,
  Card,
  TextField,
  Input,
  TextArea,
  Label,
  FieldError,
  Form,
  Spinner,
} from "@heroui/react";

import ArrowLeft from "@gravity-ui/icons/ArrowLeft";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerButtonLink } from "@/components/owner/owner-ui";
import { OwnerStatusChip } from "@/components/owner/owner-ui";
import { getMyVenueById, updateVenue } from "@/lib/api/owner";
import type { VenueResponseDto } from "@/lib/types/api";
import { buildVenueUpdateRequest } from "./venue-update";

export default function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <OwnerGuard>
      <OwnerShell activeItem="venues">
        <EditVenueForm venueId={Number(id)} />
      </OwnerShell>
    </OwnerGuard>
  );
}

function EditVenueForm({ venueId }: { venueId: number }) {
  const router = useRouter();
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getMyVenueById(venueId)
      .then((v) => {
        setVenue(v);
        setName(v.name);
        setAddress(v.address);
        setDescription(v.description ?? "");
        setPhone(v.phone ?? "");
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Không thể tải cơ sở"))
      .finally(() => setLoading(false));
  }, [venueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venue) return;
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Tên cơ sở là bắt buộc";
    if (!address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setSubmitting(true);
    try {
      await updateVenue(
        venueId,
        buildVenueUpdateRequest(venue, { name, address, description, phone }),
      );
      setVenue(await getMyVenueById(venueId));
      router.push(`/owner/venues/${venueId}`);
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!venue) {
    return <div className="flex h-64 items-center justify-center"><p className="text-[var(--danger)]">{loadError || "Không tìm thấy cơ sở"}</p></div>;
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div className="flex items-center gap-3">
        <OwnerButtonLink href={`/owner/venues/${venueId}`} variant="ghost" isIconOnly label="Quay lại"><ArrowLeft className="w-5 h-5" /></OwnerButtonLink>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Sửa cơ sở</h1>
            <OwnerStatusChip kind="venue" status={venue.status} />
          </div>
          <p className="text-sm text-[var(--muted)]">Chỉ quản trị viên có thể thay đổi trạng thái cơ sở.</p>
        </div>
      </div>

      {venue.status !== "Approved" && (
        <Alert status={venue.status === "Rejected" ? "danger" : "warning"}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Cơ sở hiện chưa được công khai</Alert.Title>
            <Alert.Description>Bạn vẫn có thể cập nhật thông tin; thao tác này không thay đổi trạng thái cơ sở.</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <Card.Header className="p-5 pb-0">
          <Card.Title className="text-base font-semibold">Thông tin cơ sở</Card.Title>
        </Card.Header>
        <Card.Content className="p-5">
          <Form onSubmit={handleSubmit} className="space-y-4">
            <TextField value={name} onChange={setName} isInvalid={!!errors.name} isRequired aria-label="Tên cơ sở">
              <Label>Tên cơ sở</Label>
              <Input />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </TextField>

            <TextField value={address} onChange={setAddress} isInvalid={!!errors.address} isRequired aria-label="Địa chỉ">
              <Label>Địa chỉ</Label>
              <Input />
              {errors.address && <FieldError>{errors.address}</FieldError>}
            </TextField>

            <TextField value={phone} onChange={setPhone} aria-label="Số điện thoại">
              <Label>Số điện thoại</Label>
              <Input type="tel" />
            </TextField>

            <TextField value={description} onChange={setDescription} aria-label="Mô tả">
              <Label>Mô tả</Label>
              <TextArea className="min-h-28" />
            </TextField>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <OwnerButtonLink href={`/owner/venues/${venueId}`} variant="ghost" className={submitting ? "pointer-events-none opacity-50" : undefined}>Hủy</OwnerButtonLink>
              <Button variant="primary" type="submit" className="w-full sm:w-auto" isDisabled={submitting} isPending={submitting}>
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
}
