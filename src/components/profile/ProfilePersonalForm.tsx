"use client";

import { useState, useMemo } from "react";
import { Form, TextField, Label, Input, Description, FieldError, Select, ListBox, DatePicker, DateField, Calendar, Button, Alert } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import Envelope from "@gravity-ui/icons/Envelope";
import FloppyDisk from "@gravity-ui/icons/FloppyDisk";
import { useAuth } from "@/lib/auth-context";
import { updateMyProfile } from "@/lib/api/profile";
import type { UserProfileResponseDto, UpdateUserProfileRequestDto } from "@/lib/types/profile";
import { GENDER_OPTIONS } from "@/lib/types/profile";

interface Props {
  profile: UserProfileResponseDto;
  onProfileUpdate: (p: UserProfileResponseDto) => void;
}

export function ProfilePersonalForm({ profile, onProfileUpdate }: Props) {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [gender, setGender] = useState<string>(profile.gender != null ? String(mapGenderToKey(profile.gender)) : "");
  const [dob, setDob] = useState(profile.dateOfBirth ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDirty = useMemo(() => {
    return (
      fullName.trim() !== (profile.fullName ?? "").trim() ||
      gender !== (profile.gender != null ? String(mapGenderToKey(profile.gender)) : "") ||
      dob !== (profile.dateOfBirth ?? "") ||
      address !== (profile.address ?? "") ||
      city !== (profile.city ?? "") ||
      country !== (profile.country ?? "")
    );
  }, [fullName, gender, dob, address, city, country, profile]);

  const fullNameError = fullName.trim().length === 0 ? "Họ tên không được để trống" : null;

  const dateValue = useMemo(() => {
    if (!dob) return undefined;
    try {
      const d = dob.split("T")[0];
      return parseDate(d);
    } catch {
      return undefined;
    }
  }, [dob]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.accessToken || fullNameError || !isDirty) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const body: UpdateUserProfileRequestDto = {
      fullName: fullName.trim(),
      gender: gender !== "" ? Number(gender) : null,
      dateOfBirth: dob || null,
      address: address || null,
      city: city || null,
      country: country || null,
    };

    try {
      const updated = await updateMyProfile(user.accessToken, body);
      onProfileUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Cập nhật thất bại";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setFullName(profile.fullName ?? "");
    setGender(profile.gender != null ? String(mapGenderToKey(profile.gender)) : "");
    setDob(profile.dateOfBirth ?? "");
    setAddress(profile.address ?? "");
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "");
    setError(null);
    setSuccess(false);
  }

  return (
    <Form onSubmit={handleSubmit} className="max-w-[640px] space-y-5">
      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Lỗi</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {success && (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>Cập nhật hồ sơ thành công!</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Email - read only info */}
      <TextField isReadOnly name="email" value={profile.email} className="opacity-80">
        <Label>
          <span className="flex items-center gap-1.5">
            <Envelope className="w-3.5 h-3.5" />
            Email
          </span>
        </Label>
        <Input />
        <Description>Email không thể thay đổi</Description>
      </TextField>

      {/* Full Name */}
      <TextField
        isRequired
        name="fullName"
        value={fullName}
        onChange={(v) => setFullName(v)}
        isInvalid={fullName.trim().length === 0 && fullName.length > 0}
      >
        <Label>Họ và tên</Label>
        <Input placeholder="Nguyễn Văn A" />
        <FieldError>{fullNameError}</FieldError>
      </TextField>

      {/* DOB + Gender: 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePicker
          className="w-full"
          name="dateOfBirth"
          value={dateValue}
          onChange={(val) => {
            if (val) {
              setDob(val.toString());
            } else {
              setDob("");
            }
          }}
          maxValue={parseDate(new Date().toISOString().split("T")[0])}
        >
          <Label>Ngày sinh</Label>
          <DateField.Group fullWidth>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover>
            <Calendar aria-label="Ngày sinh">
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {({ year }) => <Calendar.YearPickerCell year={year} />}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>

        <Select
          className="w-full"
          placeholder="Chọn giới tính"
          selectedKey={gender !== "" ? gender : undefined}
          onSelectionChange={(key) => {
            setGender(key != null ? String(key) : "");
          }}
        >
          <Label>Giới tính</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {GENDER_OPTIONS.map((opt) => (
                <ListBox.Item key={String(opt.value)} id={String(opt.value)} textValue={opt.label}>
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Address - full width */}
      <TextField name="address" value={address} onChange={setAddress}>
        <Label>Địa chỉ</Label>
        <Input placeholder="Số nhà, đường..." />
      </TextField>

      {/* City + Country: 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField name="city" value={city} onChange={setCity}>
          <Label>Thành phố</Label>
          <Input placeholder="TP. Hồ Chí Minh" />
        </TextField>

        <TextField name="country" value={country} onChange={setCountry}>
          <Label>Quốc gia</Label>
          <Input placeholder="Việt Nam" />
        </TextField>
      </div>

      {/* Submit footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onPress={handleReset}
          isDisabled={!isDirty || saving}
          className="hidden md:inline-flex"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          isPending={saving}
          isDisabled={!isDirty || !!fullNameError}
          fullWidth
          className="md:w-auto"
        >
          <FloppyDisk className="w-4 h-4" />
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </Form>
  );
}

/** Map gender string from BE to numeric key */
function mapGenderToKey(gender: string | null): number | null {
  if (gender === "Male" || gender === "Nam" || gender === "0") return 0;
  if (gender === "Female" || gender === "Nữ" || gender === "1") return 1;
  if (gender === "Other" || gender === "Khác" || gender === "2") return 2;
  const n = Number(gender);
  if (!isNaN(n) && n >= 0 && n <= 2) return n;
  return null;
}
