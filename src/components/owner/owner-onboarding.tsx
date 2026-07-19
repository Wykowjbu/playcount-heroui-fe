"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  ProgressBar,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import {
  ArrowUpRightFromSquare,
  CircleCheck,
  CircleDashed,
  CircleExclamation,
  Clock,
  FileArrowUp,
  Lock,
  ShieldCheck,
} from "@gravity-ui/icons";
import { getStatusConfig } from "@/lib/utils/status-labels";
import type { CourtOwnerProfileResponseDto } from "@/lib/types/api";
import {
  submitMyCourtOwnerProfile,
  updateMyCourtOwnerProfile,
} from "@/lib/api/owner";
import { uploadFile, validateImageFile } from "@/lib/api/upload";
import { VietnamAddressFields } from "@/components/profile/VietnamAddressFields";

interface Props {
  profile: CourtOwnerProfileResponseDto;
  onProfileChange: (profile: CourtOwnerProfileResponseDto) => void;
}

export function OwnerOnboarding({ profile, onProfileChange }: Props) {
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [businessLicenseNo, setBusinessLicenseNo] = useState(profile.businessLicenseNo ?? "");
  const [taxCode, setTaxCode] = useState(profile.taxCode ?? "");
  const [businessAddress, setBusinessAddress] = useState(profile.businessAddress ?? "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState(profile.businessLicenseDocumentUrl ?? "");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">(
    profile.businessLicenseDocumentUrl ? "success" : "idle",
  );
  const [fileError, setFileError] = useState("");
  const [pendingAction, setPendingAction] = useState<"save" | "submit" | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const editable = profile.verificationStatus === "Draft" || profile.verificationStatus === "Rejected";
  const hasDocument = Boolean(documentUrl);
  const completeFields = [businessName, businessLicenseNo, taxCode, businessAddress]
    .filter((value) => value.trim()).length + Number(hasDocument);
  const isComplete = completeFields === 5;
  const progress = profile.verificationStatus === "Pending" ? 75 : Math.round((completeFields / 5) * 50);
  const status = getStatusConfig("ownerVerification", profile.verificationStatus);

  async function uploadDocument(file: File) {
    const validationError = validateImageFile(file);
    setDocumentFile(file);
    if (validationError) {
      setFileError(validationError);
      setUploadStatus("error");
      toast.danger("Không thể tải ảnh giấy phép", { description: validationError });
      return;
    }

    setFileError("");
    setUploadStatus("uploading");
    try {
      const result = await uploadFile(file, "owner-documents");
      setDocumentUrl(result.url);
      setUploadStatus("success");
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Không thể tải ảnh giấy phép lên.");
      setUploadStatus("error");
    }
  }

  async function save(submit: boolean) {
    if (!editable || pendingAction) return;
    if (submit && !isComplete) {
      toast.danger("Vui lòng hoàn thiện đầy đủ thông tin và ảnh giấy phép trước khi gửi xét duyệt.");
      return;
    }

    setPendingAction(submit ? "submit" : "save");
    try {
      const updated = await updateMyCourtOwnerProfile({
          businessName: businessName.trim(),
          businessLicenseNo: businessLicenseNo.trim(),
          taxCode: taxCode.trim(),
          businessAddress: businessAddress.trim(),
          businessLicenseDocumentUrl: documentUrl,
        });

      let next = updated;
      if (submit) {
        next = await submitMyCourtOwnerProfile();
      }
      setDocumentFile(null);
      setUploadStatus(documentUrl ? "success" : "idle");
      onProfileChange(next);
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Thiết lập tài khoản chủ sân</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">Hoàn thiện hồ sơ kinh doanh</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Hồ sơ cần được xác minh trước khi bạn có thể tạo cơ sở và đưa sân lên PlayCourt.
          </p>
        </div>
        <Chip color={status.color} variant="soft">{status.label}</Chip>
      </div>

      {profile.verificationStatus === "Rejected" && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Hồ sơ cần được bổ sung</Alert.Title>
            <Alert.Description>
              {profile.rejectionReason || "Vui lòng kiểm tra lại thông tin, cập nhật hồ sơ và gửi xét duyệt lại."}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {profile.verificationStatus === "Pending" && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Hồ sơ đang được xét duyệt</Alert.Title>
            <Alert.Description>
              Bạn chưa cần thao tác thêm. Kết quả sẽ được gửi qua thông báo; trong thời gian này hồ sơ được khóa để tránh thay đổi dữ liệu đang xét duyệt.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-auto min-h-0 border border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-20">
          <Card.Header className="border-b border-[var(--separator)] px-5 py-4 text-left">
            <Card.Title>Tiến độ thiết lập</Card.Title>
            <Card.Description>{profile.verificationStatus === "Pending" ? "3/4 bước" : `${Math.ceil(progress / 25)}/4 bước`}</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-5 p-5">
            <ProgressBar aria-label="Tiến độ thiết lập tài khoản" value={progress}>
              <ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track>
            </ProgressBar>
            <div className="space-y-1">
              <SetupStep icon={CircleCheck} title="Xác minh email" description="Đã hoàn tất" state="done" />
              <SetupStep
                icon={isComplete || profile.verificationStatus === "Pending" ? CircleCheck : CircleDashed}
                title="Hồ sơ kinh doanh"
                description={isComplete || profile.verificationStatus === "Pending" ? "Đã đủ thông tin" : "Cần hoàn thiện"}
                state={isComplete || profile.verificationStatus === "Pending" ? "done" : "current"}
              />
              <SetupStep
                icon={profile.verificationStatus === "Rejected" ? CircleExclamation : profile.verificationStatus === "Pending" ? Clock : Lock}
                title="Admin xét duyệt"
                description={profile.verificationStatus === "Rejected" ? "Cần bổ sung hồ sơ" : profile.verificationStatus === "Pending" ? "Đang xử lý" : "Chưa gửi xét duyệt"}
                state={profile.verificationStatus === "Rejected" ? "attention" : profile.verificationStatus === "Pending" ? "current" : "locked"}
              />
              <SetupStep icon={Lock} title="Tạo cơ sở đầu tiên" description="Mở sau khi hồ sơ được duyệt" state="locked" />
            </div>
          </Card.Content>
        </Card>

        {editable ? (
          <Card className="h-auto min-h-0 border border-[var(--border)] bg-[var(--surface)]">
            <Card.Header className="border-b border-[var(--separator)] px-5 py-4 text-left sm:px-6">
              <Card.Title>Thông tin xét duyệt</Card.Title>
              <Card.Description>Nhập đúng thông tin trên giấy phép kinh doanh.</Card.Description>
            </Card.Header>
            <Card.Content className="p-5 sm:p-6">
              <Form id="owner-verification-form" className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(true); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField isRequired value={businessName} onChange={setBusinessName} maxLength={255}>
                    <Label>Tên doanh nghiệp hoặc hộ kinh doanh</Label>
                    <Input placeholder="VD: Công ty TNHH Thể thao An Phú" />
                    <FieldError />
                  </TextField>
                  <TextField isRequired value={businessLicenseNo} onChange={setBusinessLicenseNo} maxLength={100}>
                    <Label>Số giấy phép kinh doanh</Label>
                    <Input placeholder="Nhập số trên giấy phép" />
                    <FieldError />
                  </TextField>
                  <TextField isRequired value={taxCode} onChange={setTaxCode} maxLength={50}>
                    <Label>Mã số thuế</Label>
                    <Input placeholder="Nhập mã số thuế" />
                    <FieldError />
                  </TextField>
                  <VietnamAddressFields
                    address={businessAddress}
                    isRequired
                    onChange={(value) => setBusinessAddress(value.fullAddress)}
                  />
                </div>

                <div className="space-y-3">
                  <input
                    id="owner-license-document"
                    ref={documentInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    aria-describedby="owner-license-document-description"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file) void uploadDocument(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0">
                      <Label htmlFor="owner-license-document">Ảnh giấy phép kinh doanh <span className="text-[var(--danger)]">*</span></Label>
                      <Description id="owner-license-document-description" className="mt-1 max-w-2xl leading-5">
                        PNG, JPEG hoặc WEBP, tối đa 5MB. Giữ nguyên kích thước, tỷ lệ ngang/dọc và toàn bộ nội dung.
                      </Description>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full shrink-0 sm:w-auto"
                      variant="secondary"
                      isPending={uploadStatus === "uploading"}
                      isDisabled={uploadStatus === "uploading"}
                      onPress={() => documentInputRef.current?.click()}
                    >
                      <FileArrowUp className="size-4" />
                      {uploadStatus === "uploading" ? "Đang tải ảnh…" : documentUrl ? "Thay ảnh giấy phép" : "Chọn ảnh giấy phép"}
                    </Button>
                  </div>
                  {fileError && <p className="text-sm text-[var(--danger)]" role="alert">{fileError}</p>}
                </div>

                {(documentFile || documentUrl || uploadStatus === "error") && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                    {uploadStatus === "uploading" ? <Spinner size="sm" aria-label="Đang tải ảnh giấy phép" /> : uploadStatus === "success" ? <CircleCheck className="size-5 text-[var(--success)]" /> : uploadStatus === "error" ? <CircleExclamation className="size-5 text-[var(--danger)]" /> : <FileArrowUp className="size-5 text-[var(--accent)]" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{documentFile?.name || "Giấy phép đã tải lên"}</p>
                      <p className={`text-xs ${uploadStatus === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
                        {uploadStatus === "uploading" ? "Đang tải ảnh lên…" : uploadStatus === "success" ? "Đã tải lên thành công" : uploadStatus === "error" ? fileError : "Đã lưu trong hồ sơ"}
                      </p>
                    </div>
                    {uploadStatus === "error" && documentFile && <Button size="sm" variant="tertiary" onPress={() => void uploadDocument(documentFile)}>Thử lại</Button>}
                    {uploadStatus === "success" && documentUrl && (
                      <Link href={documentUrl} target="_blank" rel="noreferrer" className="text-sm">
                        Xem ảnh <ArrowUpRightFromSquare className="size-4" />
                      </Link>
                    )}
                  </div>
                )}
              </Form>
            </Card.Content>
            <Card.Footer className="flex-col-reverse gap-3 border-t border-[var(--separator)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button className="w-full sm:w-auto" variant="tertiary" isPending={pendingAction === "save"} isDisabled={Boolean(pendingAction) || uploadStatus === "uploading" || Boolean(fileError)} onPress={() => void save(false)}>
                Lưu bản nháp
              </Button>
              <Button className="w-full sm:w-auto" variant="primary" type="submit" form="owner-verification-form" isPending={pendingAction === "submit"} isDisabled={Boolean(pendingAction) || uploadStatus === "uploading" || Boolean(fileError) || !isComplete}>
                <ShieldCheck className="size-4" />Gửi xét duyệt
              </Button>
            </Card.Footer>
          </Card>
        ) : (
          <BusinessProfileSummary profile={profile} />
        )}
      </div>
    </div>
  );
}

function SetupStep({ icon: Icon, title, description, state }: { icon: typeof CircleCheck; title: string; description: string; state: "done" | "current" | "attention" | "locked" }) {
  const color = state === "done" ? "text-[var(--success)]" : state === "attention" ? "text-[var(--danger)]" : state === "current" ? "text-[var(--accent)]" : "text-[var(--muted)]";
  return <div className="flex items-start gap-3 rounded-xl px-2 py-3"><Icon className={`mt-0.5 size-5 shrink-0 ${color}`} /><div><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p></div></div>;
}

function BusinessProfileSummary({ profile }: { profile: CourtOwnerProfileResponseDto }) {
  const rows = [
    ["Doanh nghiệp", profile.businessName],
    ["Giấy phép kinh doanh", profile.businessLicenseNo],
    ["Mã số thuế", profile.taxCode],
    ["Địa chỉ kinh doanh", profile.businessAddress],
  ];
  return <Card className="h-auto min-h-0 border border-[var(--border)] bg-[var(--surface)]"><Card.Header className="border-b border-[var(--separator)] px-5 py-4 text-left sm:px-6"><Card.Title>Hồ sơ đã gửi</Card.Title><Card.Description>Thông tin đang được khóa trong thời gian xét duyệt.</Card.Description></Card.Header><Card.Content className="p-5 sm:p-6"><dl className="divide-y divide-[var(--separator)]">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-[var(--muted)]">{label}</dt><dd className="font-medium">{value || "—"}</dd></div>)}</dl>{profile.businessLicenseDocumentUrl && <Link href={profile.businessLicenseDocumentUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm">Xem ảnh giấy phép <ArrowUpRightFromSquare className="size-4" /></Link>}</Card.Content></Card>;
}
