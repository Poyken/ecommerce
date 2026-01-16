"use client";

import { useToast } from "@/components/ui/use-toast";
import { adminExportService } from "../services/admin-export.service";
import { useState } from "react";

export interface OrdersService {
  onExport: () => Promise<void>;
}

export const useOrdersExport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const exportOrders = async () => {
    try {
      setLoading(true);
      const response = await adminExportService.exportOrders();

      const url = window.URL.createObjectURL(new Blob([response as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders_export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      toast({
        title: "Export thất bại",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    exportOrders,
    loading,
  };
};
