

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface DataTablePaginationProps {
  page: number;
  total: number;
  limit: number;
}

export function DataTablePagination({
  page,
  total,
  limit,
}: DataTablePaginationProps) {
  // const t = useTranslations("common.shop"); // Fallback or adjust key
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jumpPage, setJumpPage] = useState("");

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage);
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
      setJumpPage("");
    }
  };

  if (totalPages <= 1) return null;

  // Generate page numbers with ellipses
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 py-2 text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        );
      }
      return (
        <Button
          key={`page-${p}`}
          variant={page === p ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(p as number)}
          className={
            page === p ? "" : "border-white/10 hover:bg-white/5 w-9 px-0"
          }
        >
          {p}
        </Button>
      );
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-white/10 gap-4">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrevPage}
          className="border-white/10 hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">{renderPageNumbers()}</div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(page + 1)}
          disabled={!hasNextPage}
          className="border-white/10 hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Jump to page input */}
      {totalPages > 5 && (
        <form onSubmit={handleJump} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Go to
          </span>
          <div className="relative">
            <Input
              type="number"
              value={jumpPage}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setJumpPage("");
                  return;
                }
                const num = parseInt(val);
                if (!isNaN(num)) {
                  if (num > totalPages) setJumpPage(totalPages.toString());
                  else if (num < 1) setJumpPage("1");
                  else setJumpPage(val);
                }
              }}
              className="w-20 h-9 text-center pr-8"
              placeholder="#"
            />
            <button
              type="submit"
              disabled={!jumpPage}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
