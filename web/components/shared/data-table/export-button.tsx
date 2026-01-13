"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileWarning } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ExportButtonProps {
  onExport: (format: "excel" | "csv") => Promise<void>;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "excel" | "csv") => {
    setIsLoading(true);
    try {
      await onExport(format);
      toast({
        title: "Export đang xử lý",
        description: "File sẽ tự động tải xuống khi hoàn tất.",
      });
    } catch (error) {
      toast({
        title: "Lỗi export",
        description: "Không thể xuất dữ liệu lúc này.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          Xuất ra Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} disabled>
          Xuất ra CSV (Coming soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
