import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "server-only";
import { env } from "./env";
import { deleteSession } from "./session";

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

export async function http<T>(path: string, options: FetchOptions = {}) {
  const { params, headers, ...rest } = options;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  
  if (!accessToken) {
    console.log("[HTTP] Không tìm thấy access token. Cookies hiện có:", cookieStore.getAll().map(c => c.name));
  }

  // Đảm bảo đường dẫn cơ sở được giữ nguyên khi đường dẫn bắt đầu bằng /
  const baseUrl = env.NEXT_PUBLIC_API_URL.endsWith("/")
    ? env.NEXT_PUBLIC_API_URL
    : `${env.NEXT_PUBLIC_API_URL}/`;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(cleanPath, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  console.log(`[HTTP] Đang tải: ${url.toString()}`);
  if (rest.body) console.log(`[HTTP] Nội dung: ${rest.body}`);
  if (accessToken) console.log(`[HTTP] accessToken hiện đã có`);

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Middleware nên xử lý việc làm mới. Nếu chúng ta ở đây, có nghĩa là làm mới thất bại hoặc token không hợp lệ.
      // Chúng ta có thể thử xóa phiên và chuyển hướng.
      try {
        await deleteSession();
      } catch (e) {
        console.error("Xóa phiên thất bại:", e);
      }
      redirect("/login");
    }

    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as T;
}
