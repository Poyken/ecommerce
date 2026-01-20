"use client";

import { Input } from "@/components/ui/input";
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
 * - `pl-10` tạo khoảng trống bên trái để icon không đè lên chữ. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
  isLoading,
}: AdminSearchInputProps) {
  return (
    <div className={`relative max-w-sm w-full ${className || ""}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-11 h-12 rounded-2xl bg-secondary/30 border-transparent focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary/20 transition-all font-medium pr-10 shadow-none hover:bg-secondary/50"
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
