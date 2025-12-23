# 🌐 E-COMMERCE WEB - TÀI LIỆU HƯỚNG DẪN TOÀN DIỆN

## Dành cho Thực tập sinh và Lập trình viên mới

**Phiên bản:** 2.0  
**Cập nhật lần cuối:** 18/12/2025  
**Trạng thái:** ✅ SẴN SÀNG TRIỂN KHAI

---

# 📋 MỤC LỤC

- [I. TỔNG QUAN DỰ ÁN](#i-tổng-quan-dự-án)
- [II. CÔNG NGHỆ SỬ DỤNG (TECH STACK)](#ii-công-nghệ-sử-dụng-tech-stack)
- [III. CẤU TRÚC THƯ MỤC CHI TIẾT](#iii-cấu-trúc-thư-mục-chi-tiết)
- [IV. KIẾN TRÚC ỨNG DỤNG](#iv-kiến-trúc-ứng-dụng)
- [V. LUỒNG DỮ LIỆU (DATA FLOW)](#v-luồng-dữ-liệu-data-flow)
- [VI. CÁC THÀNH PHẦN CỐT LÕI](#vi-các-thành-phần-cốt-lõi)
- [VII. SERVER ACTIONS CHI TIẾT](#vii-server-actions-chi-tiết)
- [VIII. HOOKS & PROVIDERS](#viii-hooks--providers)
- [IX. THỰC HÀNH: TRACE CODE THEO LUỒNG](#ix-thực-hành-trace-code-theo-luồng)
- [X. CÁC TRANG QUAN TRỌNG](#x-các-trang-quan-trọng)
- [XI. HƯỚNG DẪN ONBOARDING CHO THỰC TẬP SINH](#xi-hướng-dẫn-onboarding-cho-thực-tập-sinh)
- [XII. QUY TẮC TỐT NHẤT VÀ QUY ƯỚC](#xii-best-practices--quy-ước)
- [XIII. XỬ LÝ SỰ CỐ](#xiii-troubleshooting)

---

# I. TỔNG QUAN DỰ ÁN

## 1.1. Giới thiệu

Website là thành phần **Frontend** của hệ thống Thương mại điện tử, được xây dựng theo tiêu chuẩn **Luxe UI** (sang trọng, hiện đại, trải nghiệm người dùng cao cấp).

### Các phân vùng chính

| Phân vùng           | Đường dẫn                   | Mô tả                                             |
| ------------------- | --------------------------- | ------------------------------------------------- |
| **Storefront**      | `/`, `/shop`, `/products/*` | Trang chủ, danh sách sản phẩm, chi tiết sản phẩm  |
| **Cart & Checkout** | `/cart`, `/checkout`        | Giỏ hàng, thanh toán                              |
| **User Account**    | `/profile`, `/orders`       | Quản lý thông tin cá nhân, lịch sử đơn hàng       |
| **Authentication**  | `/login`, `/register`       | Đăng nhập, đăng ký                                |
| **Admin Panel**     | `/admin/*`                  | Quản trị hệ thống (Products, SKUs, Orders, Users) |

## 1.2. Số liệu dự án

```
Trang (Pages):           20+ trang
Components:              100+ components
Server Actions:          50+ actions
Dòng code:               ~20,000 dòng
Hỗ trợ ngôn ngữ:         Tiếng Việt, Tiếng Anh
```

---

# II. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

## 2.1. Framework cốt lõi

| Công nghệ      | Version         | Vai trò                    |
| -------------- | --------------- | -------------------------- |
| **Next.js**    | 15 (App Router) | Framework React full-stack |
| **React**      | 19              | UI Library                 |
| **TypeScript** | 5.x             | Type-safe JavaScript       |

## 2.2. Giao diện đồ họa (Styling & UI)

| Công nghệ         | Vai trò                               |
| ----------------- | ------------------------------------- |
| **Tailwind CSS**  | Utility-first CSS framework           |
| **Shadcn/UI**     | Component library (dựa trên Radix UI) |
| **Framer Motion** | Animation library                     |
| **Lucide React**  | Icon library                          |

## 2.3. Dữ liệu và Trạng thái (Data & State)

| Công nghệ           | Vai trò                    |
| ------------------- | -------------------------- |
| **Server Actions**  | Data fetching & mutations  |
| **React Context**   | Global state (Auth, Theme) |
| **React Hook Form** | Form management            |
| **Zod**             | Schema validation          |

## 2.4. Đa ngôn ngữ (Internationalization)

| Công nghệ     | Vai trò          |
| ------------- | ---------------- |
| **next-intl** | i18n framework   |
| **Routing**   | `/vi/*`, `/en/*` |

---

# III. CẤU TRÚC THƯ MỤC CHI TIẾT

```
web/
├── actions/                   # 🔥 SERVER ACTIONS
│   ├── auth.ts               # Đăng nhập, đăng ký, đăng xuất
│   ├── cart.ts               # CRUD giỏ hàng, checkout
│   ├── guest-cart.ts         # Giỏ hàng khách (không login)
│   ├── profile.ts            # Quản lý profile user
│   ├── address.ts            # CRUD địa chỉ giao hàng
│   ├── order.ts              # Xem đơn hàng
│   ├── review.ts             # CRUD đánh giá sản phẩm
│   └── admin.ts              # Tất cả actions cho Admin Dashboard
│
├── app/                       # 🛣️ APP ROUTER
│   ├── [locale]/             # Wrapper đa ngôn ngữ
│   │   ├── (shop)/           # Route Group: Storefront
│   │   │   ├── page.tsx      # Trang chủ
│   │   │   ├── shop/         # /shop - Danh sách sản phẩm
│   │   │   ├── products/     # /products/[slug]
│   │   │   ├── cart/         # /cart
│   │   │   ├── checkout/     # /checkout
│   │   │   ├── orders/       # /orders, /orders/[id]
│   │   │   ├── profile/      # /profile
│   │   │   ├── login/        # /login
│   │   │   ├── register/     # /register
│   │   │   └── layout.tsx    # Layout cho storefront
│   │   │
│   │   └── admin/            # Route Group: Admin Panel
│   │       ├── page.tsx      # Dashboard
│   │       ├── products/     # Quản lý sản phẩm
│   │       ├── skus/         # Quản lý biến thể
│   │       ├── orders/       # Quản lý đơn hàng
│   │       ├── users/        # Quản lý người dùng
│   │       └── ...           # Các trang admin khác
│   │
│   ├── globals.css           # Global styles
│   └── robots.ts, sitemap.ts # SEO
│
├── components/                # 🧩 UI COMPONENTS
│   ├── ui/                   # Shadcn/UI components (Button, Input, Dialog...)
│   ├── layout/               # Header, Footer, Sidebar
│   ├── features/             # Feature-specific components
│   │   ├── cart/
│   │   ├── product/
│   │   └── checkout/
│   ├── admin/                # Admin panel components
│   └── auth/                 # Login, Register forms
│
├── lib/                       # 🔧 UTILITIES
│   ├── http.ts               # HTTP client cho Server Components
│   ├── http-client.ts        # HTTP client cho Client Components
│   ├── session.ts            # Quản lý cookies (accessToken, refreshToken)
│   ├── permission-utils.ts   # Decode JWT, lấy permissions
│   ├── env.ts                # Environment variables wrapper
│   ├── utils.ts              # Helper functions (cn, formatPrice...)
│   └── animations.ts         # Framer Motion presets
│
├── hooks/                     # ⚓ CUSTOM HOOKS
│   ├── use-debounce.ts       # Debounce input
│   ├── use-toast.ts          # Toast notifications
│   └── use-user-profile.ts   # Client-side user fetching
│
├── providers/                 # 🏢 REACT CONTEXT PROVIDERS
│   └── auth-provider.tsx     # AuthContext (permissions, hasPermission)
│
├── types/                     # 🏷️ TYPESCRIPT DEFINITIONS
│   ├── models.ts             # Entity interfaces (User, Product, Order...)
│   └── dtos.ts               # DTOs, API wrappers (ApiResponse, ActionResult)
│
├── services/                  # 🌐 CLIENT-SIDE SERVICES
│   └── product.service.ts    # Ví dụ: fetch products từ client
│
├── messages/                  # 🌍 I18N TRANSLATIONS
│   ├── vi.json
│   └── en.json
│
└── public/                    # 🖼️ STATIC ASSETS
    ├── images/
    └── icons/
```

---

# IV. KIẾN TRÚC ỨNG DỤNG

## 4.1. Next.js App Router Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MIDDLEWARE (middleware.ts)                          │   │
│  │  - Check auth cookies                                │   │
│  │  - Refresh token if expired                          │   │
│  │  - Redirect if unauthorized                          │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SERVER COMPONENTS (app/[locale]/...)                │   │
│  │  - Fetch data via Server Actions                     │   │
│  │  - Render HTML on server                             │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SERVER ACTIONS (actions/*.ts)                       │   │
│  │  - Call Backend API                                  │   │
│  │  - Handle cookies (session)                          │   │
│  │  - revalidatePath for cache                          │   │
│  └─────────────────────────┬───────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (NestJS)                     │
│                    http://localhost:8080                     │
└─────────────────────────────────────────────────────────────┘
```

## 4.2. Component Types

| Loại                 | Marker         | Đặc điểm                                                                |
| -------------------- | -------------- | ----------------------------------------------------------------------- |
| **Server Component** | (mặc định)     | Chạy trên server, được data từ Server Actions, không dùng được hooks    |
| **Client Component** | `"use client"` | Chạy trên browser, dùng được hooks (useState, useEffect), interactivity |

**Quy tắc vàng:**

- Mặc định dùng **Server Component** để tối ưu performance
- Chỉ dùng **Client Component** khi cần: event handlers, hooks, browser APIs

---

# V. LUỒNG DỮ LIỆU (DATA FLOW)

## 5.1. Server Actions Flow

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ User clicks    │────▶│ Server Action   │────▶│ Backend API  │
│ "Add to Cart"  │     │ addToCartAction │     │ POST /cart   │
└────────────────┘     └────────┬────────┘     └──────┬───────┘
                                │                     │
                                │ revalidatePath      │ Response
                                ▼                     ▼
                       ┌─────────────────┐     ┌──────────────┐
                       │ Cache invalidate│◀────│ { success }  │
                       │ /cart page      │     └──────────────┘
                       └─────────────────┘
```

## 5.2. HTTP Client Flow

### Server-side (`lib/http.ts`)

```typescript
// Chỉ dùng trong Server Components/Actions
// Tự động đọc accessToken từ cookies
const data = await http<ApiResponse<Product[]>>("/products");
```

### Client-side (`lib/http-client.ts`)

```typescript
// Dùng trong Client Components (có "use client")
// Browser tự gửi cookies với credentials: "include"
const data = await httpClient<Product[]>("/products");
```

---

# VI. CÁC THÀNH PHẦN CỐT LÕI

## 6.1. Types & Models (`types/models.ts`)

Định nghĩa TypeScript interfaces cho tất cả entities:

```typescript
// Ví dụ: Product entity
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  brandId: string;
  category?: Category;
  brand?: Brand;
  options?: ProductOption[];
  skus?: Sku[];
}

// Ví dụ: Order Status enum
export type OrderStatus =
  | "PENDING" // Chờ xử lý
  | "PROCESSING" // Đang xử lý
  | "SHIPPED" // Đã giao cho shipper
  | "DELIVERED" // Đã giao thành công
  | "CANCELLED"; // Đã hủy
```

## 6.2. DTOs (`types/dtos.ts`)

Định nghĩa cấu trúc data transfer:

```typescript
// API Response wrapper (NestJS TransformInterceptor)
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

// Server Action result
export interface ActionResult<T = void> {
  success?: boolean;
  data?: T;
  error?: string;
}
```

## 6.3. HTTP Utilities (`lib/http.ts`)

```typescript
/**
 * Server-side HTTP client
 * - Tự động đọc accessToken từ cookies
 * - Tự động redirect về /login nếu 401
 * - Parse error message từ API response
 */
export async function http<T>(path: string, options?: FetchOptions): Promise<T>;

// Ví dụ sử dụng
const products = await http<ApiResponse<Product[]>>("/products");
const user = await http<ApiResponse<User>>("/auth/me", {
  skipRedirectOn401: true, // Không redirect nếu chưa login
});
```

## 6.4. Session Management (`lib/session.ts`)

```typescript
// Tạo session (lưu tokens vào httpOnly cookies)
export async function createSession(accessToken: string, refreshToken: string);

// Đăng xuất (xóa cookies)
export async function logout();

// Refresh token (gọi API để lấy token mới)
export async function refreshSession();
```

---

# VII. SERVER ACTIONS CHI TIẾT

## 7.1. Auth Actions (`actions/auth.ts`)

| Action                 | Mô tả              | Input                                           | Output                         |
| ---------------------- | ------------------ | ----------------------------------------------- | ------------------------------ |
| `loginAction`          | Đăng nhập          | FormData (email, password)                      | `{ success }` hoặc `{ error }` |
| `registerAction`       | Đăng ký            | FormData (email, password, firstName, lastName) | Redirect to `/`                |
| `logoutAction`         | Đăng xuất          | -                                               | Xóa cookies, revalidate        |
| `forgotPasswordAction` | Quên mật khẩu      | FormData (email)                                | `{ success, message }`         |
| `resetPasswordAction`  | Đặt lại mật khẩu   | FormData (token, newPassword)                   | `{ success }`                  |
| `getPermissionsAction` | Lấy quyền từ token | -                                               | `string[]`                     |

**Ví dụ sử dụng với Form:**

```tsx
// components/auth/login-form.tsx
"use client";
import { loginAction } from "@/actions/auth";
import { useActionState } from "react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <button disabled={isPending}>Đăng nhập</button>
    </form>
  );
}
```

## 7.2. Cart Actions (`actions/cart.ts`)

| Action                 | Mô tả             | Input            | Output                         |
| ---------------------- | ----------------- | ---------------- | ------------------------------ |
| `addToCartAction`      | Thêm vào giỏ      | skuId, quantity  | `{ success }`                  |
| `updateCartItemAction` | Cập nhật số lượng | itemId, quantity | `{ success }`                  |
| `removeFromCartAction` | Xóa item          | itemId           | `{ success }`                  |
| `clearCartAction`      | Xóa toàn bộ giỏ   | -                | `{ success }`                  |
| `checkoutAction`       | Thanh toán        | -                | `{ success }` hoặc `{ error }` |
| `reorderAction`        | Đặt lại đơn cũ    | orderId          | `{ success }`                  |
| `getCartCountAction`   | Đếm số item       | -                | `{ count }`                    |

## 7.3. Guest Cart Actions (`actions/guest-cart.ts`)

| Action                      | Mô tả                                                |
| --------------------------- | ---------------------------------------------------- |
| `getGuestCartDetailsAction` | Lấy thông tin SKU từ danh sách skuIds (localStorage) |
| `mergeGuestCartAction`      | Gộp giỏ hàng khách vào tài khoản sau khi login       |

**Flow Guest Cart:**

```
1. Khách thêm sản phẩm → Lưu vào localStorage
2. Hiển thị giỏ hàng → Gọi getGuestCartDetailsAction(skuIds)
3. Khách đăng nhập → Gọi mergeGuestCartAction(items)
4. Xóa localStorage guest_cart
```

## 7.4. Admin Actions (`actions/admin.ts`)

**USERS:**

- `getUsersAction`, `createUserAction`, `updateUserAction`, `deleteUserAction`, `assignRolesAction`

**ROLES & PERMISSIONS:**

- `getRolesAction`, `createRoleAction`, `updateRoleAction`, `deleteRoleAction`, `assignPermissionsAction`
- `getPermissionsAction`, `createPermissionAction`, `updatePermissionAction`, `deletePermissionAction`

**PRODUCTS & SKUs:**

- `getProductsAction`, `createProductAction`, `updateProductAction`, `deleteProductAction`
- `getSkusAction`, `updateSkuAction`, `deleteSkuAction`

**ORDERS:**

- `getOrdersAction`, `getOrderDetailsAction`, `updateOrderStatusAction`

**ANALYTICS:**

- `getAnalyticsStatsAction` - Thống kê tổng quan
- `getSalesDataAction(days)` - Dữ liệu doanh thu cho biểu đồ
- `getTopProductsAction(limit)` - Sản phẩm bán chạy

---

# VIII. HOOKS & PROVIDERS

## 8.1. AuthProvider (`providers/auth-provider.tsx`)

Cung cấp context cho việc kiểm tra quyền truy cập:

```tsx
// Sử dụng trong layout.tsx
<AuthProvider initialPermissions={permissions}>{children}</AuthProvider>;

// Sử dụng trong component
const { permissions, hasPermission } = useAuth();
if (hasPermission("admin:users")) {
  // Hiển thị nút quản lý users
}
```

## 8.2. useUserProfile Hook

```tsx
// Lấy thông tin user với optimistic UI
const { user } = useUserProfile(initialUser);
// initialUser từ Server Component để tránh loading flash
```

## 8.3. useDebounce Hook

```tsx
// Debounce search input
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // Gọi API với debouncedSearch
}, [debouncedSearch]);
```

## 8.4. useToast Hook

```tsx
const { toast } = useToast();

// Hiển thị toast
toast({
  title: "Thành công!",
  description: "Đã thêm vào giỏ hàng",
  variant: "default", // hoặc "destructive"
});
```

---

# IX. THỰC HÀNH: TRACE CODE THEO LUỒNG

## 9.1. Luồng "Thêm vào giỏ hàng"

**Mục tiêu:** Hiểu cách data flow từ UI đến Database

### Bước 1: Tìm nút "Add to Cart"

```
📁 app/[locale]/(shop)/products/[slug]/page.tsx
   └── Render <ProductDetail product={product} />
       └── 📁 components/features/product/product-detail.tsx
           └── <AddToCartButton skuId={selectedSku.id} />
```

### Bước 2: Xem AddToCartButton component

```tsx
// components/features/product/add-to-cart-button.tsx
"use client";
import { addToCartAction } from "@/actions/cart";

export function AddToCartButton({ skuId }) {
  async function handleClick() {
    const result = await addToCartAction(skuId, 1);
    if (result.success) {
      toast({ title: "Đã thêm vào giỏ!" });
    }
  }
  return <Button onClick={handleClick}>Thêm vào giỏ</Button>;
}
```

### Bước 3: Xem Server Action

```typescript
// actions/cart.ts
export async function addToCartAction(skuId: string, quantity: number = 1) {
  try {
    await http("/cart", {
      method: "POST",
      body: JSON.stringify({ skuId, quantity }),
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
```

### Bước 4: Xem HTTP utility

```typescript
// lib/http.ts
// → Đọc accessToken từ cookies
// → Gửi request đến Backend API (NestJS)
// → Xử lý response/error
```

### Bước 5: Backend API xử lý

```
POST http://localhost:8080/api/v1/cart
→ CartController.addItem()
→ CartService.addToCart()
→ PrismaService (Database)
```

---

## 9.2. Luồng "Đăng nhập"

```
1. User nhập email/password
   └── components/auth/login-form.tsx

2. Submit form → loginAction(prevState, formData)
   └── actions/auth.ts

3. Validate với Zod schema
   └── loginSchema.safeParse({ email, password })

4. Gọi Backend API
   └── http("/auth/login", { method: "POST", body: ... })

5. Nhận tokens, lưu vào cookies
   └── createSession(accessToken, refreshToken)

6. Client xử lý response
   └── Redirect về trang chủ
   └── Merge guest cart nếu có
```

---

# X. CÁC TRANG QUAN TRỌNG

## 10.1. Storefront Pages

| Trang              | Path               | File                                           |
| ------------------ | ------------------ | ---------------------------------------------- |
| Trang chủ          | `/`                | `app/[locale]/(shop)/page.tsx`                 |
| Danh sách sản phẩm | `/shop`            | `app/[locale]/(shop)/shop/page.tsx`            |
| Chi tiết sản phẩm  | `/products/[slug]` | `app/[locale]/(shop)/products/[slug]/page.tsx` |
| Giỏ hàng           | `/cart`            | `app/[locale]/(shop)/cart/page.tsx`            |
| Thanh toán         | `/checkout`        | `app/[locale]/(shop)/checkout/page.tsx`        |
| Đơn hàng           | `/orders`          | `app/[locale]/(shop)/orders/page.tsx`          |
| Chi tiết đơn hàng  | `/orders/[id]`     | `app/[locale]/(shop)/orders/[id]/page.tsx`     |
| Hồ sơ              | `/profile`         | `app/[locale]/(shop)/profile/page.tsx`         |

## 10.2. Admin Pages

| Trang      | Path                | Chức năng                   |
| ---------- | ------------------- | --------------------------- |
| Dashboard  | `/admin`            | Thống kê tổng quan, biểu đồ |
| Products   | `/admin/products`   | CRUD sản phẩm               |
| SKUs       | `/admin/skus`       | Quản lý biến thể, tồn kho   |
| Orders     | `/admin/orders`     | Quản lý đơn hàng            |
| Users      | `/admin/users`      | Quản lý người dùng          |
| Roles      | `/admin/roles`      | Quản lý vai trò             |
| Categories | `/admin/categories` | Quản lý danh mục            |
| Brands     | `/admin/brands`     | Quản lý thương hiệu         |
| Coupons    | `/admin/coupons`    | Quản lý mã giảm giá         |

---

# XI. HƯỚNG DẪN ONBOARDING CHO THỰC TẬP SINH

## 11.1. Ngày 1: Setup & Khám phá

### Buổi sáng: Setup môi trường

```bash
# 1. Clone và cài đặt
cd d:\ecommerce-main\web
npm install

# 2. Copy file môi trường
cp .env.example .env

# 3. Chạy development server
npm run dev
# → Mở http://localhost:3000
```

### Buổi chiều: Trải nghiệm như User

1. Mở trình duyệt, duyệt qua tất cả các trang
2. Thử đăng ký tài khoản mới
3. Thử thêm sản phẩm vào giỏ hàng
4. Mở **React DevTools** để xem component tree

## 11.2. Ngày 2: Hiểu cấu trúc

### Đọc và ghi chú:

1. Xem cấu trúc thư mục `app/[locale]/(shop)/`
2. Đọc file `types/models.ts` - hiểu cấu trúc dữ liệu
3. Đọc file `types/dtos.ts` - hiểu API wrappers
4. Mở một trang đơn giản (VD: `/about`) và trace từ đầu đến cuối

## 11.3. Ngày 3: Trace một luồng hoàn chỉnh

### Bài tập: Trace luồng "Thêm vào giỏ hàng"

Sử dụng hướng dẫn ở Section IX, tự trace và ghi chú lại:

- Component nào render nút "Thêm vào giỏ"?
- Server Action nào được gọi?
- API endpoint nào được gọi?
- Data flow như thế nào?

## 11.4. Ngày 4: Làm quen với Admin

1. Đăng nhập với tài khoản Admin (`admin@example.com` / `Admin@123`)
2. Duyệt qua các trang Admin
3. Trace luồng "Cập nhật SKU" từ UI đến Database

## 11.5. Ngày 5: Thực hành nhỏ

### Bài tập đề xuất:

1. Thêm một field mới vào form profile
2. Thêm validation cho một form
3. Tạo một component UI đơn giản

---

# XII. QUY TẮC TỐT NHẤT VÀ QUY ƯỚC

## 12.1. Quy ước đặt tên (Naming Conventions)

| Loại             | Convention               | Ví dụ                                    |
| ---------------- | ------------------------ | ---------------------------------------- |
| Components       | PascalCase               | `ProductCard.tsx`, `AddToCartButton.tsx` |
| Server Actions   | camelCase + "Action"     | `addToCartAction`, `loginAction`         |
| Hooks            | camelCase + "use" prefix | `useDebounce`, `useUserProfile`          |
| Files            | kebab-case               | `product-card.tsx`, `use-debounce.ts`    |
| Types/Interfaces | PascalCase               | `Product`, `OrderStatus`, `ApiResponse`  |

## 12.2. Cấu trúc Component

```tsx
// 1. Imports
import { ... } from "...";

// 2. Types (nếu cần)
interface Props { ... }

// 3. Component
export function ProductCard({ product }: Props) {
  // 3a. Hooks
  const [state, setState] = useState();

  // 3b. Handlers
  function handleClick() { ... }

  // 3c. Render
  return (
    <div>...</div>
  );
}
```

## 12.3. Cấu trúc Server Action

```typescript
export async function someAction(input: InputType): Promise<ActionResult> {
  // 1. Validate input (optional)
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  // 2. Call API
  try {
    await http("/endpoint", { method: "POST", body: ... });

    // 3. Revalidate cache
    revalidatePath("/affected-page");

    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
```

## 12.4. Đa ngôn ngữ (Internationalization / i18n)

```tsx
// Sử dụng translations
import { useTranslations } from "next-intl";

export function ProductCard() {
  const t = useTranslations("Product");

  return (
    <button>{t("addToCart")}</button>
  );
}

// messages/vi.json
{
  "Product": {
    "addToCart": "Thêm vào giỏ"
  }
}
```

---

# XIII. XỬ LÝ SỰ CỐ

## 13.1. Lỗi thường gặp

### "Module not found" khi import

- Kiểm tra path alias `@/` trong `tsconfig.json`
- Đảm bảo file tồn tại và đúng tên

### "Hydration mismatch"

- Server và Client render khác nhau
- Kiểm tra có dùng `Date`, `Math.random()` trong Server Component không
- Wrap dynamic content trong `<Suspense>` hoặc dùng `"use client"`

### "cookies() should be awaited"

- Next.js 15 yêu cầu await cookies()
- Sửa: `const cookieStore = await cookies();`

### "401 Unauthorized" loop

- Token hết hạn và refresh thất bại
- Xóa cookies trong browser và đăng nhập lại

## 13.2. Mẹo gỡ lỗi (Debug Tips)

```bash
# Xem network requests
Mở DevTools → Network tab → Lọc "Fetch/XHR"

# Xem component tree
Cài đặt React DevTools extension

# Xem server logs
Terminal đang chạy `npm run dev`

# Build để check errors
npm run build
```

---

# 🎉 KẾT LUẬN

Bạn đã có trong tay bộ tài liệu toàn diện về Frontend của dự án E-commerce. Hãy:

1. **Đọc kỹ** từng section
2. **Thực hành** trace code theo luồng
3. **Hỏi mentor** khi gặp khó khăn
4. **Ghi chú** những điều học được

> [!TIP] > **Pro tip:** Sử dụng `Ctrl + Click` trong VS Code để nhảy đến định nghĩa của bất kỳ function/variable nào!

---

**Chúc bạn có kỳ thực tập thành công! 🚀**

**Last Updated:** 18/12/2025  
**Version:** 2.0
