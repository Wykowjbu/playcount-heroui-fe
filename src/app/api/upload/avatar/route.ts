import { NextRequest, NextResponse } from "next/server";
import { ImageUploadError, uploadImage } from "@/lib/server/image-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    return NextResponse.json(await uploadImage(file, "avatars"));
  } catch (error) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
