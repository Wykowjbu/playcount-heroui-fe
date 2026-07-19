/* ------------------------------------------------------------------ */
/* Client-side upload helpers — calls Next.js server routes            */
/* Server routes protect R2 credentials                                */
/* ------------------------------------------------------------------ */

import { toast } from "@heroui/react";

export type UploadFolder = "avatars" | "venues" | "reviews";

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to R2 via Next.js server route.
 * @param file - The file to upload
 * @param folder - Storage folder (avatars, venues, reviews)
 * @returns The public URL and storage key
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder = "avatars",
): Promise<UploadResult> {
  const request = (async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/upload?folder=${folder}`, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }
    return res.json() as Promise<UploadResult>;
  })();

  toast.promise(request, {
    loading: "Đang tải ảnh lên…",
    success: "Đã tải ảnh lên",
    error: (error) => error.message || "Không thể tải ảnh lên",
  });
  return request;
}

/**
 * Validate file before upload.
 * Returns error message or null if valid.
 */
export function validateImageFile(
  file: File,
  maxSizeMB = 5,
): string | null {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "Chỉ chấp nhận ảnh PNG, JPEG, WEBP";
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Kích thước ảnh tối đa ${maxSizeMB}MB`;
  }
  return null;
}
