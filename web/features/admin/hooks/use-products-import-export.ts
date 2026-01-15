"use client";

import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import {
  downloadProductTemplateAction,
  exportProductsAction,
  importProductsAction,
  previewProductsImportAction,
} from "../domain-actions/product-actions";

export const useProductsImportExport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const downloadFile = (base64Data: string, filename: string) => {
    try {
      if (!base64Data) throw new Error("No data received");
      let cleanData = base64Data.replace(/[\s\r\n]+/g, "");
      while (cleanData.length % 4 !== 0) cleanData += "=";
      const byteCharacters = atob(cleanData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e: any) {
      console.error("Download error:", e);
      // Fallback
      try {
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } catch (e2) {
        toast({
          title: "Lỗi tải xuống",
          description: "Dữ liệu trả về không hợp lệ: " + e.message,
          variant: "destructive",
        });
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      setLoading(true);
      const res = await downloadProductTemplateAction();
      if (res.success && res.data) {
        downloadFile(res.data.base64, res.data.filename);
      } else {
        throw new Error(res.error || "Download failed");
      }
    } catch (error: any) {
      toast({
        title: "Tải template thất bại",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportProducts = async () => {
    try {
      setLoading(true);
      const res = await exportProductsAction();
      if (res.success && res.data) {
        downloadFile(res.data.base64, res.data.filename);
      } else {
        throw new Error(res.error || "Export failed");
      }
    } catch (error: any) {
      toast({
        title: "Export thất bại",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const importProducts = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await importProductsAction(formData);
      if (!res.success) throw new Error(res.error || "Import failed");
      toast({ title: "Thành công", description: "Import dữ liệu thành công." });
      return true;
    } catch (error: any) {
      toast({
        title: "Import thất bại",
        description: error.message || "Vui lòng kiểm tra lại file và thử lại.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const previewProducts = async (file: File): Promise<any[]> => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await previewProductsImportAction(formData);
      if (!res.success) throw new Error(res.error || "Preview failed");
      return res.data || [];
    } catch (error: any) {
      toast({
        title: "Lỗi xem trước",
        description: error.message || "Không thể tải bản xem trước.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadTemplate,
    exportProducts,
    importProducts,
    previewProducts,
    loading,
  };
};
