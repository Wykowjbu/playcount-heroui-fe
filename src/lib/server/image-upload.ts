import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

export const uploadFolders = ["avatars", "venues", "reviews"] as const;
export type UploadFolder = (typeof uploadFolders)[number];

const imagePresets: Record<UploadFolder, { width: number; height: number; maxBytes: number }> = {
  avatars: { width: 512, height: 512, maxBytes: 2 * 1024 * 1024 },
  venues: { width: 1600, height: 1200, maxBytes: 5 * 1024 * 1024 },
  reviews: { width: 1200, height: 1200, maxBytes: 5 * 1024 * 1024 },
};

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export class ImageUploadError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export function isUploadFolder(value: string): value is UploadFolder {
  return uploadFolders.includes(value as UploadFolder);
}

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new ImageUploadError("R2 not configured", 500);
  }

  return {
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
    client: new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } }),
  };
}

export async function uploadImage(file: File, folder: UploadFolder) {
  const preset = imagePresets[folder];
  if (!allowedTypes.has(file.type)) {
    throw new ImageUploadError("Chỉ chấp nhận ảnh PNG, JPEG, WEBP", 400);
  }
  if (file.size > preset.maxBytes) {
    throw new ImageUploadError(`Kích thước ảnh tối đa ${preset.maxBytes / 1024 / 1024}MB`, 400);
  }

  let body: Buffer;
  try {
    body = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(preset.width, preset.height, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ImageUploadError("Tệp ảnh không hợp lệ hoặc đã bị hỏng", 400);
  }

  const { client, bucket, publicUrl } = getR2Config();
  const key = `${folder}/${Date.now()}-${randomUUID()}.webp`;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return { url: `${publicUrl}/${key}`, key };
}
