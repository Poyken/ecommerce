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
 * - Thay vì sử dụng `<m.div>`, ta có thể sử dụng `<m.div>` (import { m } from "framer-motion").
 * - Tuy nhiên, dự án hiện tại đang dùng `m.div` ở rất nhiều nơi.
 * - LazyMotion vẫn có lợi ích nhất định trong việc quản lý runtime features.
 * =====================================================================
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
