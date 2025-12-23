"use client";

import { Input } from "@/components/atoms/input";
import { Search } from "lucide-react";

/**
 * =====================================================================
 * ADMIN SEARCH INPUT - Ô tìm kiếm dùng chung trong trang quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSABILITY:
 * - Thành phần này được thiết kế để dùng lại ở nhiều trang (Products, Users, Orders...).
 * - Nhận `value` và `onChange` từ component cha để quản lý trạng thái tìm kiếm.
 *
 * 2. UI/UX:
 * - Sử dụng icon `Search` từ `lucide-react` đặt tuyệt đối (`absolute`) bên trong input.
 * - `pl-10` tạo khoảng trống bên trái để icon không đè lên chữ.
 * =====================================================================
 */

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: AdminSearchInputProps) {
  return (
    <div className={`relative max-w-sm w-full ${className || ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
