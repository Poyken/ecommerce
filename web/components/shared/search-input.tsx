"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
// Thư viện giúp xử lý debounce (trì hoãn thực thi) dễ dàng
import { useDebouncedCallback } from "use-debounce";



export function SearchInput({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("common");

  // Hooks để thao tác với URL
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  // Hook quản lý trạng thái loading ngầm của React
  const [isPending, startTransition] = useTransition();

  // Local state để hiển thị những gì user đang gõ (Real-time)
  const [term, setTerm] = useState(
    searchParams.get("search")?.toString() || ""
  );

  /**
   * Đồng bộ ngược từ URL về Input
   * Case: User bấm nút Back/Forward trên trình duyệt
   * -> URL thay đổi -> Input phải cập nhật theo để khớp.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerm(searchParams.get("search")?.toString() || "");
  }, [searchParams]);

  /**
   * Hàm xử lý tìm kiếm (Đã được Debounce)
   * Chỉ chạy sau khi user ngừng gõ 200ms
   */
  const handleSearch = useDebouncedCallback((value: string) => {
    // Tạo bản sao của params hiện tại để chỉnh sửa
    const params = new URLSearchParams(searchParams);
    const trimmedTerm = value.trim();

    if (trimmedTerm) {
      params.set("search", trimmedTerm);
    } else {
      // Nếu xóa hết text -> Xóa tham số search khỏi URL
      params.delete("search");
    }

    // Quan trọng: Khi tìm kiếm mới, phải reset về trang 1
    // Nếu không user có thể đang ở trang 10 và tìm ra 2 kết quả -> Lỗi UI
    params.set("page", "1");

    // startTransition: Đánh dấu việc đổi URL là "low priority"
    // Giúp UI (input) vẫn mượt, không bị khựng lại chờ server render
    startTransition(() => {
      replace(`${pathname}?${params.toString()}` as any, { scroll: false });
    });
  }, 200); // Delay 200ms

  // Event handler cho input
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 1. Cập nhật state nội bộ ngay lập tức (để user thấy mình đang gõ)
    setTerm(value);

    // 2. Gọi hàm debounce để xử lý logic tìm kiếm (chậm lại một chút)
    handleSearch(value);
  };

  return (
    <div className="relative flex-1 md:w-80">
      {/* Icon Search cố định bên trái */}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-5 h-5 z-10 pointer-events-none" />

      <input
        value={term}
        onChange={onChange}
        placeholder={placeholder || t("searchPlaceholder")}
        className={cn(
          "w-full h-12 bg-foreground/2 dark:bg-white/2 border border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 rounded-2xl px-4 py-2 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md hover:border-foreground/10",
          className
        )}
      />

      {/* 
        LOGIC HIỂN THỊ ICON BÊN PHẢI:
        1. Nếu đang loading (isPending) -> Hiện vòng quay (Spinner).
        2. Nếu có text (term) -> Hiện nút X để xóa.
      */}
      {isPending ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      ) : (
        term && (
          <button
            onClick={() => {
              // Reset toàn bộ
              setTerm("");
              handleSearch("");

              // Hack: Focus lại vào ô input sau khi click nút X
              // Tìm input bằng placeholder để sure đúng element
              const input = document.querySelector(
                'input[placeholder="' +
                  (placeholder || t("searchPlaceholder")) +
                  '"]'
              ) as HTMLInputElement;
              if (input) input.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
          >
            <X size={16} />
          </button>
        )
      )}
    </div>
  );
}
