"use client";

import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { getErrorMessage } from "@/lib";
import {
  downloadUserTemplateAction,
  exportUsersAction,
  importUsersAction,
  previewUsersImportAction,
} from "../domain-actions/user-actions";
import type {
  ImportPreviewResult,
  ImportPreviewRow,
} from "@/types/feature-types/admin.types";

export interface UsersService {
  onImport: (file: File) => Promise<boolean>;
  onPreview: (file: File) => Promise<ImportPreviewRow[]>;
  onDownloadTemplate: () => Promise<void>;
  onExport: () => Promise<void>;
}

export const useUsersImportExport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const downloadFile = (base64Data: string, filename: string) => {
    try {
      if (!base64Data) throw new Error("No data received");

      let cleanData = base64Data.replace(/[\s\r\n]+/g, "");
      // Fix padding
      while (cleanData.length % 4 !== 0) {
        cleanData += "=";
      }

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
    } catch (e: unknown) {
      console.error("Download error:", e);

      // Fallback
      try {
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } catch {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        toast({
          title: "Lỗi tải xuống",
          description: "Dữ liệu trả về không hợp lệ: " + errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      setLoading(true);
      const res = await downloadUserTemplateAction();
      if (res.success && res.data) {
        downloadFile(res.data.base64, res.data.filename);
      } else {
        throw new Error(res.error || "Download failed");
      }
    } catch (error: unknown) {
      toast({
        title: "Tải template thất bại",
        description: getErrorMessage(error) || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async () => {
    try {
      setLoading(true);
      const res = await exportUsersAction();
      if (res.success && res.data) {
        downloadFile(res.data.base64, res.data.filename);
      } else {
        throw new Error(res.error || "Export failed");
      }
    } catch (error: unknown) {
      toast({
        title: "Export thất bại",
        description: getErrorMessage(error) || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const importUsers = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      // Use Server Action to proxy the import (authentication handled by server)
      const res = await importUsersAction(formData);

      if (!res.success) {
        throw new Error(res.error || "Import failed");
      }

      toast({
        title: "Thành công",
        description: "Import dữ liệu thành công.",
      });
      return true;
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Import thất bại",
        description:
          getErrorMessage(error) || "Vui lòng kiểm tra lại file và thử lại.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const previewUsers = async (file: File): Promise<ImportPreviewRow[]> => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await previewUsersImportAction(formData);

      if (!res.success) {
        throw new Error(res.error || "Preview failed");
      }

      // Backend returns ImportPreviewResult with rows
      const previewResult = res.data as ImportPreviewResult;
      return previewResult?.preview || [];
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Lỗi xem trước",
        description: getErrorMessage(error) || "Không thể tải bản xem trước.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadTemplate,
    exportUsers,
    importUsers,
    previewUsers,
    loading,
  };
};
