import { NextResponse } from "next/server";

import {
  isCloudinaryUploadConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinaryServer";

export async function POST(request: Request) {
  if (!isCloudinaryUploadConfigured()) {
    return NextResponse.json(
      {
        error:
          "Image upload is not configured. Add Cloudinary credentials to your environment.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const name =
      file instanceof File && file.name ? file.name : "bespoke-reference.jpg";

    const result = await uploadImageToCloudinary(file, name);

    return NextResponse.json({
      url: result.secureUrl,
      publicId: result.publicId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const runtime = "nodejs";
