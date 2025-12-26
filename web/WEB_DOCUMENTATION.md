# 🌐 E-COMMERCE WEB - TÀI LIỆU HƯỚNG DẪN TOÀN DIỆN

## Dành cho Thực tập sinh và Lập trình viên mới

**Phiên bản:** 2.1  
**Cập nhật lần cuối:** 26/12/2025  
**Trạng thái:** ✅ SẴN SÀNG TRIỂN KHAI

---

# 📋 MỤC LỤC

- [I. TỔNG QUAN DỰ ÁN](#i-tổng-quan-dự-án)
- [II. CÔNG NGHỆ SỬ DỤNG (TECH STACK)](#ii-công-nghệ-sử-dụng-tech-stack)
- [III. CẤU TRÚC THƯ MỤC CHI TIẾT (ATOMIC DESIGN)](#iii-cấu-trúc-thư-mục-chi-tiết)
- [IV. KIẾN TRÚC ỨNG DỤNG](#iv-kiến-trúc-ứng-dụng)
- [V. LUỒNG DỮ LIỆU (DATA FLOW)](#v-luồng-dữ-liệu-data-flow)
- [VI. TÍNH NĂNG CHI TIẾT (DETAILED FEATURES)](#vi-tính-năng-chi-tiết-detailed-features)
- [VII. CÁC THÀNH PHẦN CỐT LÕI](#vii-các-thành-phần-cốt-lõi)
- [VIII. SERVER ACTIONS CHI TIẾT](#viii-server-actions-chi-tiết)
- [IX. HOOKS & PROVIDERS](#ix-hooks--providers)
- [X. THỰC HÀNH: TRACE CODE THEO LUỒNG](#x-thực-hành-trace-code-theo-luồng)
- [XI. CÁC TRANG QUAN TRỌNG](#xi-các-trang-quan-trọng)
- [XII. HƯỚNG DẪN ONBOARDING CHO THỰC TẬP SINH](#xii-hướng-dẫn-onboarding-cho-thực-tập-sinh)
- [XIII. QUY TẮC TỐT NHẤT VÀ QUY ƯỚC](#xiii-best-practices--quy-ước)
- [XIV. XỬ LÝ SỰ CỐ](#xiv-troubleshooting)

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

### ⚜️ Luxury Design System (Luxe UI 2.0)

Hệ thống thiết kế tập trung vào sự tối giản, sang trọng và không gian trắng (white space).

#### 1. Color Palette (Bảng màu)

- **Primary**: `Gold` (Vàng kim) - Dùng cho nút chính, điểm nhấn.
- **Background**: `Zinc-50` (Trắng ngà) - Tạo cảm giác ấm áp hơn trắng tinh.
- **Success**: `Emerald` (Xanh ngọc) - Thông báo thành công, trạng thái tích cực.
- **Error**: `Rose` (Đỏ hồng) - Thông báo lỗi.
- **Warning**: `Amber` (Vàng hổ phách) - Cảnh báo.
- **Info**: `Blue` / `Slate` - Thông tin chung.

#### 2. Typography (Kiểu chữ)

- **Headings**: Font Serif (có chân) - Tạo vẻ cổ điển, sang trọng (VD: `Playfair Display`).
- **Body**: Font Sans-serif (không chân) - Hiện đại, dễ đọc (VD: `Inter` hoặc `Geist`).

#### 3. Principles

- **Glassmorphism**: Hiệu ứng kính mờ cho các card, overlay.
- **Micro-interactions**: Animation nhẹ nhàng khi hover, focus.

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

Dự án sử dụng mô hình **Atomic Design** để tổ chức components, giúp tăng khả năng tái sử dụng và dễ bảo trì.

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
│   │   │   ├── orders/       # /orders
│   │   │   ├── profile/      # /profile
│   │   │   └── layout.tsx    # Layout
│   │   │
│   │   └── admin/            # Route Group: Admin Panel
│   │       ├── dashboard/    # Dashboard
│   │       ├── products/     # Quản lý sản phẩm
│   │       └── ...
│   │
│   ├── globals.css           # Global styles
│   └── robots.ts, sitemap.ts # SEO
│
├── components/                # 🧩 ATOMIC UI COMPONENTS
│   ├── atoms/                # 🧱 Nguyên tử: Thành phần nhỏ nhất (Button, Input, Badge)
│   ├── molecules/            # 🧬 Phân tử: Kết hợp atoms (SearchBox, ProductCard, UserNav)
│   ├── organisms/            # 🐙 Sinh vật: Khối UI phức tạp (Header, Footer, HeroSection)
│   ├── templates/            # 📄 Templates: Cấu trúc trang logic (HomeContent, ProductDetailContent)
│   ├── providers/            # 🛡️ Providers: Context Wrappers (AuthProvider, ThemeProvider)
│   └── ui/                   # 🎨 Shadcn Base: Các component cơ bản từ thư viện
│
├── lib/                       # 🔧 UTILITIES
│   ├── http.ts               # HTTP client
│   ├── session.ts            # Session management
│   ├── utils.ts              # Helper functions
│   └── ...
│
├── hooks/                     # ⚓ CUSTOM HOOKS
│   ├── use-debounce.ts
│   ├── use-toast.ts
│   └── ...
│
├── messages/                  # 🌍 I18N TRANSLATIONS
└── public/                    # 🖼️ STATIC ASSETS
```

## 3.1. Phân tích Atomic Design

- **Atoms**: Các thành phần nguyên tử, không thể chia nhỏ hơn. Chỉ chứa style và logic hiển thị cơ bản. KHÔNG call API.
  - _Ví dụ_: `Button`, `Input`, `Avatar`, `Badge`.
- **Molecules**: Nhóm các atoms lại để thực hiện một chức năng đơn giản. Có thể có state nội tại.
  - _Ví dụ_: `SearchInput` (Input + Icon + Button), `ProductVariantSelector` (RadioGroups + Label).
- **Organisms**: Các section lớn của trang, kết hợp nhiều molecules và atoms. Thường chứa business logic cụ thể hoặc call API.
  - _Ví dụ_: `Header` (Logo + Nav + Search + Cart + User), `ProductGrid`, `OrderSummary`.
- **Templates**: (Thường nằm trong `components/templates/`) Định nghĩa khung xương của một trang. Đây là nơi tập trung logic chính của trang (Client Component) để tách biệt khỏi Next.js Page (Server Component).
  - _Ví dụ_: `HomeContent`, `ShopContent`, `LoginPageContent`.

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
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TEMPLATES (components/templates/...)                │   │
│  │  (Client Components)                                 │   │
│  │  - Handle Interactivity (Clicks, State)              │   │
│  │  - Optimistic UI Updates                             │   │
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

## 4.3. Templates & Layouts Pattern

Trong dự án này, chúng ta sử dụng pattern **Page -> Template**:

1. **Page (`page.tsx`)**:

   - Là Server Component.
   - Nhiệm vụ: Fetch dữ liệu ban đầu (Initial Data Fetching), đọc SearchParams, Check Permissions.
   - Truyền dữ liệu xuống Template.

2. **Template (`components/templates/xyz-content.tsx`)**:
   - Là Client Component (`"use client"`).
   - Nhiệm vụ: Render UI, xử lý State, User Interaction.

_Ví dụ:_

```tsx
// app/shop/page.tsx (Server)
export default async function ShopPage() {
  const products = await getProductsAction();
  return <ShopContent initialProducts={products} />;
}

// components/templates/shop-content.tsx (Client)
("use client");
export function ShopContent({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  // ... filtering logic
  return <div>...</div>;
}
```

---

# VI. TÍNH NĂNG CHI TIẾT (DETAILED FEATURES)

Hệ thống cung cấp một bộ tính năng toàn diện cho cả Khách hàng (Storefront) và Quản trị viên (Admin Panel).

## 6.1. Xác thực & Bảo mật (Authentication & Security)

Hệ thống sử dụng cơ chế bảo mật đa lớp để bảo vệ tài khoản người dùng và dữ liệu.

- **JWT (JSON Web Tokens)**: Sử dụng Access Token (ngắn hạn) và Refresh Token (dài hạn) để quản lý phiên đăng nhập.
- **Security Fingerprinting**:
  - Mỗi token được gắn với một "Dấu vân tay" (Fingerprint) bao gồm thông tin thiết bị (User-Agent) và IP.
  - Hệ thống tự động phát hiện và chặn các request nếu Fingerprint thay đổi bất thường (chống trộm token).
- **RBAC (Role-Based Access Control)**:
  - Hệ thống phân quyền dựa trên Vai trò (Role) và Quyền hạn (Permission).
  - Ví dụ: Nhân viên kho chỉ có quyền xem đơn hàng, không được sửa sản phẩm.
- **CSRF Protection**: Bảo vệ chống lại các cuộc tấn công Cross-Site Request Forgery.

## 6.2. Trải nghiệm Mua sắm (Shopping Experience)

### 🛍️ Khám phá sản phẩm

- **Tìm kiếm thông minh**: Tìm kiếm sản phẩm theo tên, mô tả.
- **Bộ lọc nâng cao**: Lọc theo Danh mục, Thương hiệu, Khoảng giá, và các thuộc tính khác.
- **Biến thể sản phẩm (SKUs)**: Hỗ trợ sản phẩm có nhiều biến thể (Màu sắc, Kích thước, Vật liệu) với giá và tồn kho riêng biệt.

### 🛒 Giỏ hàng (Cart)

- **Giỏ hàng khách (Guest Cart)**: Cho phép khách vãng lai thêm hàng vào giỏ mà không cần đăng nhập (lưu trữ local).
- **Đồng bộ giỏ hàng**: Khi khách đăng nhập, giỏ hàng khách sẽ tự động được gộp vào giỏ hàng chính của tài khoản.
- **Cập nhật thời gian thực**: Tính toán lại tổng tiền ngay lập tức khi thay đổi số lượng.

### 💳 Thanh toán (Checkout)

- **Tính phí vận chuyển tự động (GHN Integration)**:
  - Tích hợp trực tiếp với API Giao Hàng Nhanh (GHN).
  - Tự động tính phí ship dựa trên Địa chỉ nhận hàng và Kích thước/Khối lượng sản phẩm.
- **Phương thức thanh toán đa dạng**:
  - **COD**: Thanh toán khi nhận hàng.
  - **Chuyển khoản ngân hàng (Banking)**: Hiển thị mã QR để khách chuyển khoản.
  - **Ví điện tử**: MoMo, VNPay (đang phát triển).
- **Mã giảm giá (Coupons)**: Áp dụng mã giảm giá theo % hoặc số tiền cố định.

## 6.3. Tài khoản Người dùng (User Profile)

- **Dashboard cá nhân**: Xem tổng quan hoạt động, đơn hàng gần đây.
- **Quản lý đơn hàng**:
  - Theo dõi trạng thái đơn hàng (Chờ xử lý, Đang giao, Đã giao, v.v.).
  - Xem chi tiết từng sản phẩm trong đơn.
  - Hủy đơn hàng (nếu chưa được xử lý).
  - Đặt lại đơn hàng cũ (Re-order).
- **Sổ địa chỉ (Address Book)**:
  - Quản lý nhiều địa chỉ giao hàng.
  - Tích hợp dữ liệu hành chính Việt Nam (Tỉnh/Thành, Quận/Huyện, Phường/Xã) từ GHN.
- **Blog cá nhân**: Người dùng có thể viết bài chia sẻ, review sản phẩm (User Generated Content).

## 6.4. Hệ thống Blog & Content

- **Quản lý bài viết**: Soạn thảo bài viết với Rich Text Editor.
- **Đa ngôn ngữ**: Hỗ trợ viết bài bằng nhiều ngôn ngữ (Tiếng Việt, Tiếng Anh).
- **Gắn sản phẩm**: Cho phép gắn các sản phẩm liên quan vào bài viết để thúc đẩy bán hàng (Upsell).

## 6.5. Quản trị hệ thống (Admin Dashboard)

Dành cho Quản trị viên và Nhân viên vận hành.

### 📊 Tổng quan (Analytics)

- Biểu đồ doanh thu theo thời gian thực.
- Top sản phẩm bán chạy.
- Thống kê đơn hàng mới, khách hàng mới.

### 📦 Quản lý Sản phẩm & Kho hàng

- **Product Management**: Tạo/Sửa/Xóa sản phẩm, quản lý hình ảnh, SEO metadata.
- **SKU Management**: Quản lý chi tiết từng biến thể, cập nhật giá và tồn kho nhanh chóng.
- **Brand & Category**: Quản lý thương hiệu và danh mục sản phẩm phân cấp.

### 🧾 Quản lý Đơn hàng (Order Fulfillment)

- Xem danh sách đơn hàng với bộ lọc trạng thái.
- Cập nhật quy trình xử lý đơn hàng (Duyệt đơn -> Đóng gói -> Giao vận chuyển).
- In phiếu giao hàng (tính năng dự kiến).

### 👥 Quản lý Người dùng & Phân quyền

- Quản lý danh sách người dùng.
- Tạo và cấp phát Vai trò (Roles) và Quyền hạn (Permissions) chi tiết.

### ⚙️ Tính năng hệ thống (System Features)

- **Feature Flags**: Bật/Tắt tính năng nóng mà không cần deploy lại code (VD: Tắt tính năng thanh toán online khi bảo trì).
- **Audit Logs**: Ghi lại nhật ký hoạt động của hệ thống để tra soát.

---

# VII. CÁC THÀNH PHẦN CỐT LÕI

## 7.1. Types & Models (`types/models.ts`)

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

## 7.2. DTOs (`types/dtos.ts`)

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

## 7.3. HTTP Utilities (`lib/http.ts`)

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

## 7.4. Session Management (`lib/session.ts`)

```typescript
// Tạo session (lưu tokens vào httpOnly cookies)
export async function createSession(accessToken: string, refreshToken: string);

// Đăng xuất (xóa cookies)
export async function logout();

// Refresh token (gọi API để lấy token mới)
export async function refreshSession();
```

---

# VIII. SERVER ACTIONS CHI TIẾT

## 8.1. Auth Actions (`actions/auth.ts`)

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

## 8.2. Cart Actions (`actions/cart.ts`)

| Action                 | Mô tả             | Input            | Output                         |
| ---------------------- | ----------------- | ---------------- | ------------------------------ |
| `addToCartAction`      | Thêm vào giỏ      | skuId, quantity  | `{ success }`                  |
| `updateCartItemAction` | Cập nhật số lượng | itemId, quantity | `{ success }`                  |
| `removeFromCartAction` | Xóa item          | itemId           | `{ success }`                  |
| `clearCartAction`      | Xóa toàn bộ giỏ   | -                | `{ success }`                  |
| `checkoutAction`       | Thanh toán        | -                | `{ success }` hoặc `{ error }` |
| `reorderAction`        | Đặt lại đơn cũ    | orderId          | `{ success }`                  |
| `getCartCountAction`   | Đếm số item       | -                | `{ count }`                    |

## 8.3. Guest Cart Actions (`actions/guest-cart.ts`)

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

## 8.4. Admin Actions (`actions/admin.ts`)

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

# IX. HOOKS & PROVIDERS

## 9.1. AuthProvider (`providers/auth-provider.tsx`)

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

## 9.2. useUserProfile Hook

```tsx
// Lấy thông tin user với optimistic UI
const { user } = useUserProfile(initialUser);
// initialUser từ Server Component để tránh loading flash
```

## 9.3. useDebounce Hook

```tsx
// Debounce search input
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // Gọi API với debouncedSearch
}, [debouncedSearch]);
```

## 9.4. useToast Hook (`components/ui/use-toast.ts`)

Dùng để hiển thị thông báo (Notification) ở góc màn hình. Đã được style lại theo **Luxe UI**:

```tsx
const { toast } = useToast();

toast({
  title: "Đơn hàng đã được tạo!",
  description: "Chúng tôi sẽ liên hệ sớm.",
  variant: "success", // Emerald background
});
// Các variants: default, destructive (Rose), success (Emerald), warning (Amber), info (Blue)
```

## 9.5. Virtualization (`useVirtualizer`)

Sử dụng trong các bảng dữ liệu lớn (VD: Admin Products) để chỉ render những item đang hiển thị trên màn hình -> **Performance tối ưu**.

**Lưu ý quan trọng**: Khi dùng với Table (`<table>`), phải sử dụng kỹ thuật "Padding Row" để tránh lỗi Hydration. Xem `products-client.tsx` để biết mẫu implement chuẩn.

---

# X. THỰC HÀNH: TRACE CODE THEO LUỒNG

## 10.1. Luồng "Thêm vào giỏ hàng"

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

## 10.2. Luồng "Đăng nhập"

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

# XI. CÁC TRANG QUAN TRỌNG

## 11.1. Storefront Pages

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

## 11.2. Admin Pages

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

# XII. HƯỚNG DẪN ONBOARDING CHO THỰC TẬP SINH

## 12.1. Ngày 1: Setup & Khám phá

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

## 12.2. Ngày 2: Hiểu cấu trúc

### Đọc và ghi chú:

1. Xem cấu trúc thư mục `app/[locale]/(shop)/`
2. Đọc file `types/models.ts` - hiểu cấu trúc dữ liệu
3. Đọc file `types/dtos.ts` - hiểu API wrappers
4. Mở một trang đơn giản (VD: `/about`) và trace từ đầu đến cuối

## 12.3. Ngày 3: Trace một luồng hoàn chỉnh

### Bài tập: Trace luồng "Thêm vào giỏ hàng"

Sử dụng hướng dẫn ở Section X, tự trace và ghi chú lại:

- Component nào render nút "Thêm vào giỏ"?
- Server Action nào được gọi?
- API endpoint nào được gọi?
- Data flow như thế nào?

## 12.4. Ngày 4: Làm quen với Admin

1. Đăng nhập với tài khoản Admin (`admin@example.com` / `Admin@123`)
2. Duyệt qua các trang Admin
3. Trace luồng "Cập nhật SKU" từ UI đến Database

## 12.5. Ngày 5: Thực hành nhỏ

### Bài tập đề xuất:

1. Thêm một field mới vào form profile
2. Thêm validation cho một form
3. Tạo một component UI đơn giản

---

# XIII. QUY TẮC TỐT NHẤT VÀ QUY ƯỚC

## 13.1. Quy ước đặt tên (Naming Conventions)

| Loại             | Convention               | Ví dụ                                    |
| ---------------- | ------------------------ | ---------------------------------------- |
| Components       | PascalCase               | `ProductCard.tsx`, `AddToCartButton.tsx` |
| Server Actions   | camelCase + "Action"     | `addToCartAction`, `loginAction`         |
| Hooks            | camelCase + "use" prefix | `useDebounce`, `useUserProfile`          |
| Files            | kebab-case               | `product-card.tsx`, `use-debounce.ts`    |
| Types/Interfaces | PascalCase               | `Product`, `OrderStatus`, `ApiResponse`  |

## 13.2. Cấu trúc Component

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

## 13.3. Cấu trúc Server Action

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

## 13.4. Đa ngôn ngữ (Internationalization / i18n)

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

# XIV. XỬ LÝ SỰ CỐ

## 14.1. Lỗi thường gặp

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

## 14.2. Mẹo gỡ lỗi (Debug Tips)

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

**Last Updated:** 26/12/2025  
**Version:** 2.1
