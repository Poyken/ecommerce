"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { simulatePaymentSuccessAction } from "@/features/orders/actions";
import { useRouter } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { Copy, CreditCard, ExternalLink, Loader2, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * BANK TRANSFER QR - Mã QR thanh toán chuyển khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VIETQR STANDARD:
 * - Mã QR được generate theo chuẩn VietQR (được hỗ trợ bởi hầu hết app ngân hàng VN).
 * - Sử dụng API của `vietqr.io` để render ảnh QR động dựa trên số tiền và nội dung.
 * - Cấu trúc: `https://img.vietqr.io/image/<BANK_ID>-<ACC_NO>-<TEMPLATE>.png?amount=...&addInfo=...`
 *
 * 2. POLLING MECHANISM (`useEffect` + `setInterval`):
 * - Đếm ngược thời gian hết hạn (15 phút).
 * - Trong thực tế, component này có thể poll API trạng thái đơn hàng (`setInterval`)
 *   để tự động redirect khi backend nhận được tiền (webhook từ ngân hàng).
 *
 * 3. DEV SIMULATION MODE:
 * - Vì môi trường dev không thể kết nối ngân hàng thật, ta có nút "Simulation".
 * - Gọi Server Action `simulatePaymentSuccessAction` để giả lập sự kiện Webhook thành công.
 * =====================================================================
 */

interface BankTransferQRProps {
  amount: number;
  orderCode: string;
  orderId?: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  createdAt?: string;
  qrUrl?: string;
}

export function BankTransferQR({
  amount,
  orderCode,
  orderId,
  bankId = "MB",
  accountNo = "0352224640",
  accountName = "NGUYEN VAN DUC",
  createdAt,
  qrUrl,
}: BankTransferQRProps) {
  const t = useTranslations("orders");
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Hydration fix: Chỉ render client-side logic khi mount xong
  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown Timer Logic
  useEffect(() => {
    if (!createdAt) return;

    // 15 minutes expire time
    const EXPIRE_TIME = 15 * 60 * 1000;
    const createdTime = new Date(createdAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - createdTime;
      const remaining = Math.max(0, EXPIRE_TIME - elapsed);
      setTimeLeft(remaining);
      return remaining;
    };

    // Initial check
    if (updateTimer() <= 0) return;

    const timer = setInterval(() => {
      if (updateTimer() <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!mounted) return null;

  // Real VietQR URL Construction
  // AddInfo và AccountName phải được URL Encode để tránh lỗi ký tự đặc biệt
  const info = encodeURIComponent(orderCode);
  const name = encodeURIComponent(accountName);
  const qrSrc =
    qrUrl ||
    `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("copied"),
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 
        COLUMN 1: QR CODE DISPLAY 
        Hiển thị ảnh QR và đồng hồ đếm ngược
      */}
      <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border-primary/10">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <QrCode className="text-primary w-5 h-5" />
          {t("scanToPay") || "Scan to Pay"}
        </h3>

        <div className="relative group p-2 bg-white rounded-xl shadow-lg transition-transform duration-300 hover:scale-105">
          <Image
            src={qrSrc}
            alt="VietQR for Banking App"
            width={320}
            height={320}
            className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
            unoptimized
          />
        </div>

        {/* Countdown Badge */}
        {timeLeft !== null && timeLeft > 0 && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium mt-2 animate-pulse">
            <span>Expires in: {formatTime(timeLeft)}</span>
          </div>
        )}

        {timeLeft === 0 && (
          <div className="text-red-500 font-bold text-sm mt-2">
            Order payment expired
          </div>
        )}

        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Open your <strong>Banking App</strong> and scan this QR code.
        </p>

        {/* 
           DEV TOOL: SIMULATION BUTTON 
           Chỉ nên hiển thị trong môi trường Dev hoặc Test 
        */}
        <div className="pt-4 mt-2 border-t border-dashed border-border/50 w-full flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-amber-500">
            Dev Simulation
          </span>
          <button
            onClick={async (e) => {
              e.preventDefault();
              const id = orderId || orderCode;
              if (!id || isSimulating) return;

              setIsSimulating(true);
              try {
                // Gọi Server Action để giả lập webhook thành công
                const res = await simulatePaymentSuccessAction(id);
                if (res.success) {
                  toast({
                    title: "Payment Confirmed",
                    description: "Order status updated to PROCESSING.",
                    variant: "success",
                  });
                  router.push(`/orders/${id}`);
                  router.refresh();
                } else {
                  toast({
                    title: "Error",
                    description: res.error || "Failed to simulate payment",
                    variant: "destructive",
                  });
                }
              } catch {
                toast({
                  title: "Error",
                  description: "An unexpected error occurred",
                  variant: "destructive",
                });
              } finally {
                setIsSimulating(false);
              }
            }}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline p-2 rounded-md bg-amber-50 dark:bg-amber-900/10 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ExternalLink className="w-3 h-3" />
            )}
            Trigger &quot;Payment Success&quot;
          </button>
        </div>
      </GlassCard>

      {/* 
        COLUMN 2: MANUAL TRANSFER INFO 
        Thông tin số tài khoản cho người dùng không scan được QR
      */}
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2 tracking-tight">
            <CreditCard className="text-primary w-6 h-6" />
            {t("transferInfo")}
          </h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            If you cannot scan the QR code to make a payment, please verify
            manually or use the simulation link.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/20 transition-colors">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
              Amount
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-primary tracking-tight">
                {formatCurrency(amount)}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                onClick={() => copyToClipboard(amount.toString(), "Amount")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/20 transition-colors">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
              Transfer Content (Memo)
            </p>
            <div className="flex items-center justify-between">
              <p className="font-mono font-bold text-lg tracking-wider">
                {orderCode}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                onClick={() => copyToClipboard(orderCode, "Content")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 flex gap-2">
          <span>⚠️</span>
          <span>
            environment. The QR code provided is a real VietQR that works with
            banking apps, but no real money will be processed by the system. Use
            the &quot;Dev Simulation&quot; link to manually confirm payment.
          </span>
        </div>
      </div>
    </div>
  );
}
