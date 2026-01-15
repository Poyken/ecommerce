"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { returnRequestsApi } from "@/features/return-requests/return-requests.api";
import { ReturnRequest, ReturnStatus } from "@/features/return-requests/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, XCircle } from "lucide-react";

export function UpdateReturnStatusDialog({
  returnRequest,
  open,
  onOpenChange,
}: {
  returnRequest: ReturnRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const [status, setStatus] = useState<ReturnStatus>(returnRequest.status);
  const [inspectionNotes, setInspectionNotes] = useState(returnRequest.inspectionNotes || "");
  const [rejectedReason, setRejectedReason] = useState(returnRequest.rejectedReason || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === ReturnStatus.REJECTED && !rejectedReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await returnRequestsApi.update(returnRequest.id, {
        status,
        inspectionNotes: status === ReturnStatus.INSPECTING || status === ReturnStatus.REFUNDED || status === ReturnStatus.REJECTED ? inspectionNotes : undefined,
        rejectedReason: status === ReturnStatus.REJECTED ? rejectedReason : undefined,
      });

      toast({
        title: t("success"),
        description: t("returns.successUpdate"),
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const allowedTransitions: Record<string, ReturnStatus[]> = {
    [ReturnStatus.PENDING]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
    [ReturnStatus.APPROVED]: [ReturnStatus.WAITING_FOR_RETURN, ReturnStatus.CANCELLED],
    [ReturnStatus.WAITING_FOR_RETURN]: [ReturnStatus.IN_TRANSIT, ReturnStatus.RECEIVED, ReturnStatus.CANCELLED],
    [ReturnStatus.IN_TRANSIT]: [ReturnStatus.RECEIVED],
    [ReturnStatus.RECEIVED]: [ReturnStatus.INSPECTING],
    [ReturnStatus.INSPECTING]: [ReturnStatus.REFUNDED, ReturnStatus.REJECTED],
    [ReturnStatus.REFUNDED]: [],
    [ReturnStatus.REJECTED]: [],
    [ReturnStatus.CANCELLED]: [],
  };

  const isOptionDisabled = (optionValue: string) => {
    if (optionValue === returnRequest.status) return false;
    const allowed = allowedTransitions[returnRequest.status] || [];
    return !allowed.includes(optionValue as ReturnStatus);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("returns.updateStatus")}
      description={t("returns.details") + ": #" + returnRequest.id.split("-")[0].toUpperCase()}
      onSubmit={handleUpdate}
      isPending={loading}
      disabled={loading || (status === returnRequest.status && inspectionNotes === (returnRequest.inspectionNotes || "") && rejectedReason === (returnRequest.rejectedReason || ""))}
      submitLabel={t("update")}
    >
      <div className="space-y-6 py-4">
        {/* Status Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {t("returns.statusLabel")}
          </label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as ReturnStatus)}
          >
            <SelectTrigger className="h-12 rounded-xl border-2 focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(Object.keys(allowedTransitions) as ReturnStatus[]).concat([ReturnStatus.REFUNDED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED]).filter((v, i, a) => a.indexOf(v) === i).map((s) => (
                <SelectItem 
                  key={s} 
                  value={s} 
                  disabled={isOptionDisabled(s)}
                  className="rounded-lg"
                >
                  {t(`returns.statusMapping.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Inspection Notes - Show when appropriate */}
        {(status === ReturnStatus.INSPECTING || status === ReturnStatus.REFUNDED || status === ReturnStatus.REJECTED) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-bold flex items-center gap-2 text-blue-600">
              <ClipboardList className="h-4 w-4" />
              {t("returns.inspectionNotes")}
            </label>
            <Textarea
              placeholder="Ghi chú kết quả kiểm tra hàng hóa..."
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              className="min-h-[100px] rounded-xl border-2 focus:ring-blue-200"
            />
          </div>
        )}

        {/* Rejection Reason */}
        {status === ReturnStatus.REJECTED && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-xl border-2 border-red-100 bg-red-50/50">
            <label className="text-sm font-bold flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              {t("returns.rejectedReason")} (Bắt buộc)
            </label>
            <Textarea
              placeholder="Giải thích lý do từ chối yêu cầu trả hàng..."
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              required
              className="min-h-[100px] rounded-xl border-2 border-red-100 focus:ring-red-200 bg-white"
            />
            <p className="text-[11px] text-red-500 font-medium italic">
              * Lý do này sẽ được gửi đến khách hàng.
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-100 flex gap-3">
          <AlertCircle className="h-5 w-5 text-slate-400 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed font-medium">
            Việc cập nhật trạng thái sẽ tự động thông báo và thay đổi quyền của khách hàng đối với yêu cầu này (ví dụ: cho phép nhập mã vận đơn).
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
