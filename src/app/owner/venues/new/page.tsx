"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TextField,
  Input,
  Label,
  FieldError,
  Form,
  Spinner,
} from "@heroui/react";

import ArrowLeft from "@gravity-ui/icons/ArrowLeft";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
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
      await createVenue({ name: name.trim(), address: address.trim(), description: description.trim() || undefined, phone: phone.trim() || undefined });
      router.push("/owner/venues");
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : "Tạo cơ sở thất bại" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/venues">
          <Button variant="ghost" isIconOnly aria-label="Quay lại">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tạo cơ sở mới</h1>
          <p className="text-sm text-[var(--muted)]">Điền thông tin cơ sở của bạn</p>
        </div>
      </div>

      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-base font-semibold">Thông tin cơ sở</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
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
              <Input placeholder="Mô tả về cơ sở..." />
            </TextField>

            {errors.form && <p className="text-sm text-[var(--danger)]">{errors.form}</p>}

            <div className="flex gap-3 pt-2">
              <Link href="/owner/venues">
                <Button variant="ghost" isDisabled={submitting}>Hủy</Button>
              </Link>
              <Button variant="primary" type="submit" isDisabled={submitting} isPending={submitting}>
                Tạo cơ sở
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
