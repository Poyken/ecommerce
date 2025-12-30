import { http } from "./http";

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Uploads a file directly to Cloudinary using a backend-generated signature.
 * This ensures security without passing large files through our backend server.
 */
export async function uploadToCloudinary(
  file: File,
  accessToken?: string,
  folder = "ecommerce-reviews"
): Promise<string> {
  // 1. Get Signature from Backend
  const sigRes = await http<
    CloudinarySignatureResponse | { data: CloudinarySignatureResponse }
  >(`/common/cloudinary/signature?folder=${folder}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    skipRedirectOn401: true,
  });

  // NestJS TransformInterceptor wraps results in { data: ... }
  const signData = (
    "data" in sigRes ? sigRes.data : sigRes
  ) as CloudinarySignatureResponse;

  // 2. Direct Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", signData.timestamp.toString());
  formData.append("signature", signData.signature);
  formData.append("folder", signData.folder);

  const cloudName = signData.cloudName;
  if (!cloudName) throw new Error("Missing cloudName in signature");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}
