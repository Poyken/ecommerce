// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// FRONTEND DOCUMENTATION & ARCHITECTURE - TÀI LIỆU KIẾN TRÚC FRONTEND
// =================================================================================================
//
// Chào mừng bạn đến với codebase Frontend của dự án E-Commerce Platform!
// File này đóng vai trò như một bản đồ tóm tắt (Cheat Sheet) giúp bạn nắm bắt nhanh
// cấu trúc và các công nghệ cốt lõi đang được sử dụng.
//
// ĐIỂM NHẤN QUAN TRỌNG:
// 1. Next.js App Router: Chúng ta sử dụng mô hình routing mới nhất, ưu tiên Server Components.
// 2. Feature-First Organization: Code được chia theo "tính năng" (Products, Cart) thay vì "loại file".
// 3. Strict TypeScript: Mọi dữ liệu đều phải được định nghĩa kiểu rõ ràng. Không dùng `any`.
//
// HÃY ĐỌC KỸ CÁC MỤC DƯỚI ĐÂY TRƯỚC KHI BẮT ĐẦU CODE.
// =================================================================================================
/**
 * =====================================================================
 * E-COMMERCE PLATFORM - WEB FRONTEND
 * =====================================================================
 *
 * 🏗️ ARCHITECTURE OVERVIEW
 *
 * This frontend is built with Next.js 16 App Router, following modern
 * React patterns and best practices for enterprise applications.
 *
 * 1. FEATURE-BASED STRUCTURE
 *    Code is organized by business feature (products, cart, checkout)
 *    rather than technical role (components, hooks, utils).
 *
 * 2. SERVER COMPONENTS FIRST
 *    Leverages RSC for optimal performance. Client components are
 *    used only when interactivity is required.
 *
 * 3. TYPE SAFETY
 *    Full TypeScript coverage with strict mode enabled.
 *    Zod schemas for runtime validation.
 *
 * 4. INTERNATIONALIZATION
 *    Built-in i18n support via next-intl with SSR/SSG compatibility.
 *
 * 📁 DIRECTORY STRUCTURE
 *
 * app/
 * ├── [locale]/              - Locale-prefixed routes
 * │   ├── (shop)/            - Customer-facing pages
 * │   ├── admin/             - Admin dashboard
 * │   └── super-admin/       - Platform management
 *
 * components/
 * ├── ui/                    - Base UI components (shadcn/ui)
 * └── shared/                - Reusable business components
 *
 * features/
 * ├── products/              - Product browsing & detail
 * ├── cart/                  - Shopping cart
 * ├── checkout/              - Checkout flow
 * ├── orders/                - Order history
 * ├── auth/                  - Authentication
 * ├── admin/                 - Admin features
 * └── ...                    - Other business domains
 *
 * lib/
 * ├── http.ts                - API client with interceptors
 * ├── utils.ts               - Utility functions
 * ├── schemas.ts             - Zod validation schemas
 * ├── animations.ts          - Framer Motion variants
 * └── hooks/                 - Custom React hooks
 *
 * types/
 * ├── models.ts              - Domain entity types
 * ├── dtos.ts                - Data transfer objects
 * └── api.ts                 - API response types
 *
 * 🎨 DESIGN SYSTEM
 *
 * - Colors: CSS variables in globals.css (supports dark mode)
 * - Typography: Inter font family
 * - Spacing: Tailwind CSS utility classes
 * - Components: shadcn/ui with custom extensions
 *
 * 🔧 DEVELOPMENT COMMANDS
 *
 * npm run dev        - Start development server
 * npm run build      - Build for production
 * npm run lint       - Run ESLint
 * npm run type-check - Run TypeScript compiler
 *
 * =====================================================================
 * © 2024-2026 E-Commerce Platform. All rights reserved.
 * =====================================================================
 */

export {};
