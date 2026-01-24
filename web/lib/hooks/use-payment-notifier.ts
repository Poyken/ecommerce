"use client";

import { useEffect } from "react";
import { useSocket } from "./use-socket";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "@/i18n/routing";

/**
 * =====================================================================
 * USE PAYMENT NOTIFIER - Hook lắng nghe trạng thái thanh toán real-time
 * =====================================================================
 *
 * 🎯 USAGE:
 * - Dùng trong Checkout để tự động redirect khi user thanh toán QR thành công.
 * - Dùng để hiển thị toast chúc mừng khi order được xác nhận.
 */
export function usePaymentNotifier(orderId?: string) {
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Lắng nghe thông báo mới
    socket.on("new_notification", (notification: any) => {
      // Logic lọc thông báo về đơn hàng hiện tại
      if (
        notification.type === "ORDER" &&
        notification.message.includes("thanh toán thành công")
      ) {
        toast({
          title: "Thanh toán thành công!",
          description: notification.message,
          variant: "success",
        });

        if (orderId && notification.message.includes(orderId.substring(0, 8))) {
          router.push(`/checkout/success?orderId=${orderId}`);
        }
      }
    });

    return () => {
      socket.off("new_notification");
    };
  }, [socket, isConnected, orderId, toast, router]);
}
