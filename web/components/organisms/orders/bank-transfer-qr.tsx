"use client";

import { simulatePaymentSuccessAction } from "@/actions/order";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { formatCurrency } from "@/lib/utils";
import { Copy, CreditCard, ExternalLink, Loader2, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface BankTransferQRProps {
  amount: number;
  orderCode: string;
  orderId?: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  createdAt?: string;
}

export function BankTransferQR({
  amount,
  orderCode,
  orderId,
  bankId = "MB",
  accountNo = "0352224640",
  accountName = "NGUYEN VAN DUC",
  createdAt,
}: BankTransferQRProps) {
  const t = useTranslations("orders");
  const router = useRouter();
  const { toast } = useToast();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!createdAt) return;

    // 15 minutes in ms
    const EXPIRE_TIME = 15 * 60 * 1000;
    const createdTime = new Date(createdAt).getTime();

    // Initial check
    const now = Date.now();
    const elapsed = now - createdTime;
    const remaining = Math.max(0, EXPIRE_TIME - elapsed);
    setTimeLeft(remaining);

    if (remaining <= 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - createdTime;
      const remaining = Math.max(0, EXPIRE_TIME - elapsed);

      setTimeLeft(remaining);

      if (remaining <= 0) {
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

  // Real VietQR for Banking Apps
  // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
  const info = encodeURIComponent(orderCode);
  const name = encodeURIComponent(accountName);
  const qrSrc = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`;

  // Simulation Link (Dev/Testing)
  const targetId = orderId || orderCode;
  const simulationLink = `${origin}/${locale}/simulate-payment-confirmation/${targetId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("copied"),
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* QR Code Column */}
      <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border-primary/10">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <QrCode className="text-primary w-5 h-5" />
          {t("scanToPay") || "Scan to Pay"}
        </h3>

        <div className="relative group p-2 bg-white rounded-xl shadow-lg transition-transform duration-300 hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="VietQR for Banking App"
            className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
          />
        </div>

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

        {/* Dev Tool: Simulation Link */}
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
              } catch (error) {
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
            Trigger "Payment Success"
          </button>
        </div>
      </GlassCard>

      {/* Manual Transfer Info */}
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
            <span className="font-bold">Check:</span> This is a simulated
            environment. The QR code provided is a real VietQR that works with
            banking apps, but no real money will be processed by the system. Use
            the "Dev Simulation" link to manually confirm payment.
          </span>
        </div>
      </div>
    </div>
  );
}
