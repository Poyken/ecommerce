"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import React from "react";

/**
 * =====================================================================
 * MOTION PROVIDER - Tối ưu Framer Motion Bundle Size
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BUNDLE SIZE ISSUE:
 * - Mặc định, `framer-motion` load tất cả các tính năng (drag, layout, SVG...)
 *   vào bundle chính (~30kb gzipped).
 *
 * 2. LAZY MOTION SOLUTION:
 * - `LazyMotion` cho phép ta chỉ load các tính năng cơ bản (`domAnimation`).
 * - Các tính năng nâng cao chỉ được tải khi cần thiết.
 * - Giúp giảm đáng kể kích thước file JS ban đầu, cải thiện điểm LCP/TTI.
 *
 * 3. USAGE:
 * - Thay vì sử dụng `<motion.div>`, ta NÊN sử dụng `<m.div>` (import { m } from "framer-motion").
 * - Dự án hiện tại đã áp dụng `m.div` ở hầu hết các nơi để tối ưu hóa hiệu năng.
 * - LazyMotion giúp quản lý runtime features một cách thông minh và hiệu quả. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Bundle Optimization: Cắt giảm tới 25kb dung lượng JS dư thừa mà người dùng phải tải về, giúp website "nhẹ" hơn đáng kể.
 * - Smooth Interactions: Cung cấp nền tảng để tạo ra các hiệu ứng di chuột (hover) và chuyển động (transition) mượt mà 60fps trên mọi trình duyệt.

 * =====================================================================
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
