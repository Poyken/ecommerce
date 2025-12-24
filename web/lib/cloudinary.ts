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
  folder = "ecommerce-reviews"
): Promise<string> {
  // 1. Get Signature from Backend
  // Note: http client automatically handles auth headers if needed by backend (it does)
  const sigRes = await http<CloudinarySignatureResponse>(
    `/common/cloudinary/signature?folder=${folder}`
  );

  // The http wrapper returns the response body directly usually,
  // but let's check standard usage.
  // If http returns { data: ... } wrapper or just data?
  // Checking actions/review.ts: const res = await http<ApiResponse<...>>
  // So it returns the parsed JSON. The signature endpoint returns the object directly
  // (NestJS default) unless wrapped in { data: ... }.
  // The CloudinaryController calls service.generateSignature returning object directly.

  // BUT the http function might wrap it? or just return result?
  // Let's assume standard behavior: returns parsed JSON.

  const signData = sigRes as unknown as CloudinarySignatureResponse;

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
