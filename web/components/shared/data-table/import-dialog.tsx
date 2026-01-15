"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ImportDialogProps {
  title?: string;
  onImport: (file: File) => Promise<any>;
  onPreview?: (file: File) => Promise<any[]>;
  onDownloadTemplate: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ImportDialog({
  title = "Import Data",
  onImport,
  onPreview,
  onDownloadTemplate,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ImportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen =
    externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  const [step, setStep] = useState<"upload" | "preview" | "importing">(
    "upload"
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setPreviewData(null);
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const handlePreview = async () => {
    if (!file || !onPreview) return;
    setIsLoading(true);
    try {
      const data = await onPreview(file);
      // Backend for Users returns { total, valid, rows... }, others might return just rows
      // We normalize it here
      const rows = Array.isArray(data) ? data : (data as any).rows || [];
      setPreviewData(rows);
      setStep("preview");
    } catch (error) {
      // Toast handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      await onImport(file);
      // Toast handled in hook
      handleOpenChange(false);
    } catch (error) {
      // Toast handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const total = previewData?.length || 0;
  const invalidRows = previewData?.filter((r) => !r.isValid) || [];
  const invalidCount = invalidRows.length;
  const validCount = total - invalidCount;

  // Get dynamic headers from first row
  const previewHeaders =
    previewData && previewData.length > 0
      ? Object.keys(previewData[0]).filter(
          (k) => !["isValid", "errors", "rowNumber"].includes(k)
        )
      : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-7xl gap-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Tải lên file Excel để nhập dữ liệu. Hãy tải mẫu trước để điền đúng định dạng."
              : `Kiểm tra lại dữ liệu trước khi nhập vào hệ thống.`}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="grid gap-6 py-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">File Mẫu Chuẩn</h4>
                  <p className="text-xs text-muted-foreground">
                    Sử dụng file này để tránh lỗi định dạng.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
                Tải Xuống
              </Button>
            </div>

            <div className="grid w-full gap-2">
              <Label htmlFor="dropzone-file">Tải lên file dữ liệu</Label>
              <div className="flex items-center justify-center w-full">
                <Label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors border-slate-200 dark:border-slate-700"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <div className="text-center space-y-2">
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-blue-600">
                          <FileUp className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                          }}
                        >
                          Xóa file
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground/50" />
                        <p className="mb-2 text-sm text-foreground font-medium">
                          Click để tải lên hoặc kéo thả vào đây
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hỗ trợ: .xlsx, .xls (Tối đa 10MB)
                        </p>
                      </>
                    )}
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && previewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Tổng số dòng
                </p>
                <p className="text-2xl font-black mt-1">{total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold tracking-wider">
                  Hợp lệ
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-green-700 dark:text-green-400">
                    {validCount}
                  </p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold tracking-wider">
                  Lỗi
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-red-700 dark:text-red-400">
                    {invalidCount}
                  </p>
                  {invalidCount > 0 && (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {invalidCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cảnh báo dữ liệu</AlertTitle>
                <AlertDescription>
                  Có {invalidCount} dòng bị lỗi (Dòng:{" "}
                  {invalidRows
                    .map((r) => r.rowNumber)
                    .slice(0, 20)
                    .join(", ")}
                  {invalidCount > 20 ? "..." : ""}). Những dòng này sẽ bị bỏ qua
                  khi import.
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <TableRow>
                      {previewHeaders.map((header) => (
                        <TableHead key={header} className="capitalize">
                          {header}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Kết quả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow
                        key={i}
                        className={!row.isValid ? "bg-red-50/50" : ""}
                      >
                        {previewHeaders.map((header) => (
                          <TableCell key={header}>
                            {row[header]?.toString() || ""}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          {row.isValid ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Hợp lệ
                            </Badge>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {row.errors.map((e: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  {e}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy bỏ
          </Button>

          {step === "upload" ? (
            <Button
              onClick={handlePreview}
              disabled={!file || isLoading}
              className="bg-primary"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tiếp tục: Xem trước
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep("upload")}
                disabled={isLoading}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleImport}
                disabled={!previewData || validCount === 0 || isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận Import ({validCount} dòng)
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
