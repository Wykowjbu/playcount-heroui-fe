"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FieldError, Form, Input, Label, Link, ListBox, Select, TextField } from "@heroui/react";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { createCourt } from "@/lib/api/owner";
import { getAllSports } from "@/lib/api/discovery";
import type { SportDto } from "@/lib/types/api";

export default function NewCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OwnerGuard><OwnerShell activeItem="venues"><NewCourtForm venueId={Number(id)} /></OwnerShell></OwnerGuard>;
}

function NewCourtForm({ venueId }: { venueId: number }) {
  const router = useRouter();
  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void getAllSports().then(setSports).catch((err) => setError(err.message)); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const court = await createCourt(venueId, {
        name: String(data.get("name")),
        sportId: Number(data.get("sportId")),
        indoor: data.get("indoor") === "true",
      });
      router.push(`/owner/venues/${venueId}/courts/${court.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo sân");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href={`/owner/venues/${venueId}`} className="inline-flex items-center gap-1 text-sm"><ChevronLeft className="size-4" />Quay lại cơ sở</Link>
      <div><h1 className="text-2xl font-bold">Thêm sân</h1><p className="text-sm text-muted">Tạo sân con thuộc cơ sở.</p></div>
      {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
      <Form className="space-y-4" onSubmit={submit}>
        <TextField isRequired className="w-full" name="name"><Label>Tên sân</Label><Input placeholder="Sân 1" /><FieldError /></TextField>
        <Select isRequired className="w-full" name="sportId" placeholder="Chọn môn thể thao"><Label>Môn thể thao</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{sports.map((sport) => <ListBox.Item id={sport.id} key={sport.id} textValue={sport.name}>{sport.name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>
        <Select isRequired className="w-full" name="indoor" defaultValue="true"><Label>Loại sân</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox><ListBox.Item id="true" textValue="Trong nhà">Trong nhà<ListBox.ItemIndicator /></ListBox.Item><ListBox.Item id="false" textValue="Ngoài trời">Ngoài trời<ListBox.ItemIndicator /></ListBox.Item></ListBox></Select.Popover></Select>
        <Button className="w-full" type="submit" isPending={loading}>Tạo sân</Button>
      </Form>
    </div>
  );
}
