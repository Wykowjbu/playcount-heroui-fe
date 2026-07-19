"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  TextField,
  Input,
  TextArea,
  Label,
  FieldError,
  Form,
} from "@heroui/react";

import ArrowLeft from "@gravity-ui/icons/ArrowLeft";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerButtonLink } from "@/components/owner/owner-ui";
import { createVenue } from "@/lib/api/owner";

export default function CreateVenuePage() {
  return (
    <OwnerGuard>
      <OwnerShell activeItem="venues">
        <CreateVenueForm />
      </OwnerShell>
    </OwnerGuard>
  );
}

function CreateVenueForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Tên cơ sở là bắt buộc";
    if (!address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setSubmitting(true);
    try {
      const venue = await createVenue({ name: name.trim(), address: address.trim(), description: description.trim() || undefined, phone: phone.trim() || undefined });
      router.push(`/owner/venues/${venue.id}`);
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div className="flex items-center gap-3">
        <OwnerButtonLink href="/owner/venues" variant="ghost" isIconOnly label="Quay lại"><ArrowLeft className="w-5 h-5" /></OwnerButtonLink>
        <div>
          <h1 className="text-2xl font-bold">Tạo cơ sở mới</h1>
          <p className="text-sm text-[var(--muted)]">Điền thông tin cơ sở của bạn</p>
        </div>
      </div>

      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <Card.Header className="p-5 pb-0">
          <Card.Title className="text-base font-semibold">Thông tin cơ sở</Card.Title>
        </Card.Header>
        <Card.Content className="p-5">
          <Form onSubmit={handleSubmit} className="space-y-4">
            <TextField value={name} onChange={setName} isInvalid={!!errors.name} isRequired aria-label="Tên cơ sở">
              <Label>Tên cơ sở</Label>
              <Input placeholder="VD: Sân Cầu Lông ABC" />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </TextField>

            <TextField value={address} onChange={setAddress} isInvalid={!!errors.address} isRequired aria-label="Địa chỉ">
              <Label>Địa chỉ</Label>
              <Input placeholder="Số đường, phường, quận, thành phố" />
              {errors.address && <FieldError>{errors.address}</FieldError>}
            </TextField>

            <TextField value={phone} onChange={setPhone} aria-label="Số điện thoại">
              <Label>Số điện thoại</Label>
              <Input placeholder="0912345678" type="tel" />
            </TextField>

            <TextField value={description} onChange={setDescription} aria-label="Mô tả">
              <Label>Mô tả</Label>
              <TextArea placeholder="Mô tả về cơ sở..." className="min-h-28" />
            </TextField>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <OwnerButtonLink href="/owner/venues" variant="ghost" className={submitting ? "pointer-events-none opacity-50" : undefined}>Hủy</OwnerButtonLink>
              <Button variant="primary" type="submit" className="w-full sm:w-auto" isDisabled={submitting} isPending={submitting}>
                Tạo cơ sở
              </Button>
            </div>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
}
