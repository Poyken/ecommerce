"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface ExportButtonProps {
  onExport: (format: "excel" | "csv") => Promise<void>;
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButton({ onExport, size = "default" }: ExportButtonProps) {
  const t = useTranslations("admin");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "excel" | "csv") => {
    setIsLoading(true);
    try {
      await onExport(format);
      toast({
        title: t("exportProcessing"),
        description: t("exportFileWillDownload"),
      });
    } catch (error) {
      toast({
        title: t("exportError"),
        description: t("exportErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className="gap-2 rounded-xl" disabled={isLoading}>
          <Download className="h-4 w-4" />
          {t("export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          {t("exportExcel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} disabled>
          {t("exportCsv")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
