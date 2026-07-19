import { NextRequest, NextResponse } from "next/server";
import { ImageUploadError, isUploadFolder, uploadImage } from "@/lib/server/image-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const folder = new URL(request.url).searchParams.get("folder") ?? "";
    if (!isUploadFolder(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    return NextResponse.json(await uploadImage(file, folder));
  } catch (error) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
