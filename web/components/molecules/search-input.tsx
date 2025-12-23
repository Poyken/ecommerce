"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

/**
 * =====================================================================
 * SEARCH INPUT - Ô tìm kiếm thông minh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEBOUNCED SEARCH:
 * - Sử dụng `useDebouncedCallback` để trì hoãn việc cập nhật URL khi người dùng đang gõ.
 * - Giúp giảm số lượng request gửi lên server và tránh làm lag giao diện.
 *
 * 2. SEARCH-AS-YOU-TYPE (URL State):
 * - Mỗi khi người dùng gõ, tham số `?search=...` trên URL sẽ được cập nhật.
 * - Next.js sẽ tự động re-fetch dữ liệu dựa trên URL mới này.
 *
 * 3. SYNC LOCAL STATE:
 * - `useEffect` đảm bảo rằng nếu người dùng nhấn Back/Forward trên trình duyệt, giá trị trong ô input vẫn khớp với URL.
 * =====================================================================
 */

export function SearchInput({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(
    searchParams.get("search")?.toString() || ""
  );

  // Sync local state with URL params (e.g. on back/forward navigation)
  useEffect(() => {
    setTerm(searchParams.get("search")?.toString() || "");
  }, [searchParams]);

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    const trimmedTerm = value.trim();

    if (trimmedTerm) {
      params.set("search", trimmedTerm);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}` as any, { scroll: false });
    });
  }, 300);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTerm(value);
    handleSearch(value);
  };

  return (
    <div className="relative flex-1 md:w-80">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-5 h-5 z-10 pointer-events-none" />
      <input
        value={term}
        onChange={onChange}
        placeholder={placeholder || t("searchPlaceholder")}
        className={cn(
          "w-full h-12 bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 text-foreground placeholder:text-muted-foreground/40 rounded-2xl px-4 py-2 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md hover:border-foreground/10",
          className
        )}
      />
      {isPending ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      ) : (
        term && (
          <button
            onClick={() => {
              setTerm("");
              handleSearch("");
              // Focus back to input
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
