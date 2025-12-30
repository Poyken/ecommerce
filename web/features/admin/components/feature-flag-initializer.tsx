/**
 * =====================================================================
 * FEATURE FLAG INITIALIZER - Khởi chạy hệ thống flag
 * =====================================================================
 * 
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * 
 * 1. RUN-ONCE PATTERN:
 * - Component này không render gì cả (`return null`), chỉ có nhiệm vụ gọi API fetch flags 1 lần duy nhất khi App khởi động.
 * 
 * 2. PERFORMANCE:
 * - Đặt ở Root Layout giúp flags có sẵn sớm nhất có thể, tránh tình trạng UI bị "giật" (flicker) khi tính năng hiện/ẩn sau khi load.
 * =====================================================================
 */

"use client";

import { useEffect } from "react";
import { useFeatureFlagStore } from "../store/feature-flag.store";

export function FeatureFlagInitializer() {
  const fetchFlags = useFeatureFlagStore((state) => state.fetchFlags);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return null;
}
