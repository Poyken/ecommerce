import { http } from "./http";

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}


export async function uploadToCloudinary(
  file: File,
  accessToken?: string,
  folder = "ecommerce-reviews"
): Promise<string> {
  // 1. Lấy Chữ ký bảo mật (Signature) từ Backend
  const sigRes = await http<
    CloudinarySignatureResponse | { data: CloudinarySignatureResponse }
  >(`/common/cloudinary/signature?folder=${folder}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    skipRedirectOn401: true,
  });

  // NestJS TransformInterceptor bọc kết quả trong { data: ... } nên ta cần unwrap if needed
  const signData = (
    "data" in sigRes ? sigRes.data : sigRes
  ) as CloudinarySignatureResponse;

  // 2. Upload trực tiếp đến server Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", signData.timestamp.toString());
  formData.append("signature", signData.signature);
  formData.append("folder", signData.folder);

  const cloudName = signData.cloudName;
  if (!cloudName) throw new Error("Thiếu cấu hình CloudName trong signature");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Lỗi khi tải ảnh lên Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
}
