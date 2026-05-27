import { createHash } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function getCloudName(): string {
  return (
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.NEXT_CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    ""
  );
}

function getCredentials(): { apiKey: string; apiSecret: string } | null {
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  return { apiKey, apiSecret };
}

export function isCloudinaryUploadConfigured(): boolean {
  const cloudName = getCloudName();
  const creds = getCredentials();
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
  return Boolean(cloudName && (creds || preset));
}

export type CloudinaryUploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
};

export async function uploadImageToCloudinary(
  file: Blob,
  filename: string
): Promise<CloudinaryUploadResult> {
  const cloudName = getCloudName();
  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const mime = file.type || "image/jpeg";
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Only JPEG, PNG, WebP, GIF, or HEIC images are allowed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mime });
  formData.append("file", blob, filename || "reference.jpg");
  formData.append("folder", "bespoke-quotes");

  const creds = getCredentials();
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  if (creds) {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=bespoke-quotes&timestamp=${timestamp}${creds.apiSecret}`;
    const signature = createHash("sha1").update(paramsToSign).digest("hex");
    formData.append("api_key", creds.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
  } else if (preset) {
    formData.append("upload_preset", preset);
  } else {
    throw new Error(
      "Set CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET, or CLOUDINARY_UPLOAD_PRESET"
    );
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  const json = (await res.json()) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? "Cloudinary upload failed");
  }

  const secureUrl = json.secure_url ?? json.url;
  if (!secureUrl || !json.public_id) {
    throw new Error("Invalid response from Cloudinary");
  }

  return {
    url: json.url ?? secureUrl,
    secureUrl,
    publicId: json.public_id,
  };
}
