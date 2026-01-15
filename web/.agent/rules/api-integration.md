# Quy Tắc Tích Hợp API

## Tech Stack

- **Server Actions**: next-safe-action
- **HTTP Client**: Custom wrapper (`lib/http.ts`)
- **Validation**: Zod schemas
- **Real-time**: Socket.io client

## Server Actions với next-safe-action

### Action Structure

```typescript
// features/products/actions/create-product.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { productSchema } from "../schemas";
import { revalidatePath } from "next/cache";

export const createProduct = actionClient
  .schema(productSchema)
  .action(async ({ parsedInput }) => {
    try {
      const response = await http.post("/products", parsedInput);

      revalidatePath("/admin/products");

      return {
        success: true,
        data: response.data,
        message: "Tạo sản phẩm thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  });
```

### Sử dụng trong Component

```typescript
"use client";

import { useAction } from "next-safe-action/hooks";
import { createProduct } from "../actions/create-product";

function CreateProductForm() {
  const { execute, isExecuting, result } = useAction(createProduct, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        router.push("/admin/products");
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Có lỗi xảy ra");
    },
  });

  const onSubmit = (data: ProductForm) => {
    execute(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Button type="submit" disabled={isExecuting}>
        {isExecuting ? "Đang tạo..." : "Tạo sản phẩm"}
      </Button>
    </form>
  );
}
```

## HTTP Client

### Cấu hình Base

```typescript
// lib/http.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, config);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>("POST", endpoint, data, config);
  }

  // ... other methods

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: config?.signal,
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}

export const http = new HttpClient(API_BASE_URL);
```

## Error Handling

### Error Types

```typescript
// lib/error-utils.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return "Dữ liệu không hợp lệ";
      case 401:
        return "Phiên đăng nhập hết hạn";
      case 403:
        return "Không có quyền truy cập";
      case 404:
        return "Không tìm thấy dữ liệu";
      case 500:
        return "Lỗi hệ thống, vui lòng thử lại";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Có lỗi xảy ra";
}
```

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
}
```

## Socket.io Integration

```typescript
// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}

// Usage in component
useEffect(() => {
  const socket = getSocket();
  socket.connect();

  socket.on("stock:update", (data: StockUpdate) => {
    updateLocalStock(data);
  });

  return () => {
    socket.off("stock:update");
  };
}, []);
```

## Response Types

```typescript
// lib/types.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Usage
type ProductsResponse = ApiResponse<PaginatedResponse<Product>>;
```

## Caching Strategy

| Data Type              | Strategy           | TTL  |
| ---------------------- | ------------------ | ---- |
| Static (categories)    | Cache indefinitely | -    |
| Semi-static (products) | SWR revalidate     | 60s  |
| Dynamic (cart, orders) | No cache           | -    |
| User-specific          | Per-user cache     | 5min |
