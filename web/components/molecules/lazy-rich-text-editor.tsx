/**
 * =====================================================================
 * LAZY RICH TEXT EDITOR - Dynamic Import wrapper cho TipTap
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CODE SPLITTING (Phân tách mã nguồn):
 * - TipTap là một thư viện khá nặng (~150KB gzipped). Nếu import trực tiếp, nó sẽ làm chậm tốc độ load trang ban đầu (Initial Load).
 * - Sử dụng `next/dynamic` (bản chất là React.lazy + Suspense) để tách editor ra thành một file JS riêng (chunk).
 * - File này chỉ được tải xuống khi browser thực sự cần render Editor.
 *
 * 2. SSR DISABLED (Tắt Server-Side Rendering):
 * - Hầu hết các thư viện Editor (như TipTap, Quill, Draft.js) đều cần truy cập `window` hoặc `document` ngay khi khởi tạo.
 * - Trên Server (Node.js) không có `window` -> Gây lỗi. -> Bắt buộc dùng `{ ssr: false }`.
 *
 * 3. LOADING SKELETON:
 * - Trong lúc chờ tải file JS của Editor, ta hiển thị một `Skeleton` để giữ chỗ (Placeholder).
 * - Giúp tránh hiện tượng layout bị giật (Cumulative Layout Shift - CLS).
 * =====================================================================
 */

"use client";

import { Skeleton } from "@/components/atoms/skeleton";
import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Skeleton component cho loading state
function RichTextEditorSkeleton() {
  return (
    <div className="border rounded-md">
      {/* Toolbar skeleton */}
      <div className="border-b bg-muted/50 p-2 flex items-center gap-1 flex-wrap">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>
      {/* Editor content skeleton */}
      <div className="p-4 min-h-[200px] space-y-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

// Dynamic import với SSR disabled
const RichTextEditorBase = dynamic(
  () =>
    import("./rich-text-editor").then((mod) => ({
      default: mod.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => <RichTextEditorSkeleton />,
  }
);

// Type-safe wrapper
type RichTextEditorProps = ComponentProps<typeof RichTextEditorBase>;

export function LazyRichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorBase {...props} />;
}

// Export skeleton for external use
export { RichTextEditorSkeleton };
