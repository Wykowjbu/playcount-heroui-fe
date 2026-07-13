"use client";

import { useEffect, useState, use } from "react";
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
import { getMyVenueById, updateVenue } from "@/lib/api/owner";
import type { VenueResponseDto } from "@/lib/types/api";

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

  useEffect(() => {
    getMyVenueById(venueId)
      .then((v) => {
        setVenue(v);
        setName(v.name);
        setAddress(v.address);
        setDescription(v.description ?? "");
        setPhone(v.phone ?? "");
      })
      .catch((err: unknown) => setErrors({ form: err instanceof Error ? err.message : "Lỗi" }))
      .finally(() => setLoading(false));
  }, [venueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Tên cơ sở là bắt buộc";
    if (!address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setSubmitting(true);
    try {
      await updateVenue(venueId, { name: name.trim(), address: address.trim(), description: description.trim() || undefined, phone: phone.trim() || undefined });
      router.push(`/owner/venues/${venueId}`);
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : "Cập nhật thất bại" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!venue) {
    return <div className="flex h-64 items-center justify-center"><p className="text-[var(--danger)]">{errors.form ?? "Không tìm thấy cơ sở"}</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/owner/venues/${venueId}`}>
          <Button variant="ghost" isIconOnly aria-label="Quay lại">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Sửa cơ sở</h1>
          <p className="text-sm text-[var(--muted)]">{venue.name}</p>
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
              <Input />
            </TextField>

            {errors.form && <p className="text-sm text-[var(--danger)]">{errors.form}</p>}

            <div className="flex gap-3 pt-2">
              <Link href={`/owner/venues/${venueId}`}>
                <Button variant="ghost" isDisabled={submitting}>Hủy</Button>
              </Link>
              <Button variant="primary" type="submit" isDisabled={submitting} isPending={submitting}>
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
