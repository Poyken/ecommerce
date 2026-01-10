"use client";

import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * =====================================================================
 * PURCHASE TOAST - Thông báo mua hàng thời gian thực
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MARKETING PSYCHOLOGY - FOMO:
 * - Hiển thị "Ai đó vừa mua..." để tạo hiệu ứng đám đông (Social Proof).
 * - Làm cho website trông có vẻ "đắt hàng" -> Kích thích user chốt đơn nhanh hơn.
 *
 * 2. ANIMATE PRESENCE (Framer Motion):
 * - React thuần không hỗ trợ animation khi unmount (gỡ bỏ) component.
 * - `AnimatePresence` giúp component "sống sót" thêm vài ms để chạy nốt animation `exit` rồi mới biến mất hẳn.
 *
 * 3. NOTIFICATION LOOP LOGIC:
 * - Dùng cặp `setTimeout` lồng nhau:
 *   + Timer 1: Show toast -> Chờ 5s -> Hide toast.
 *   + Timer 2: Sau khi hide -> Chờ random 15-25s -> Gọi lại hàm showNext.
 * - Tạo ra một vòng lặp vô tận nhưng có khoảng nghỉ ngẫu nhiên để trông tự nhiên.
 * =====================================================================
 */
interface PurchaseNotification {
  id: string;
  customerName: string;
  productName: string;
  location: string;
  timeAgo: string;
}

// Fake purchase data - Trong thực tế sẽ lấy từ WebSocket hoặc API
const fakePurchases: PurchaseNotification[] = [
  {
    id: "1",
    customerName: "Nguyễn V.",
    productName: "Silk Evening Dress",
    location: "Hà Nội",
    timeAgo: "2 phút trước",
  },
  {
    id: "2",
    customerName: "Trần M.",
    productName: "Premium Leather Bag",
    location: "TP.HCM",
    timeAgo: "5 phút trước",
  },
  {
    id: "3",
    customerName: "Lê H.",
    productName: "Classic White Sneakers",
    location: "Đà Nẵng",
    timeAgo: "8 phút trước",
  },
  {
    id: "4",
    customerName: "Phạm T.",
    productName: "Wool Cashmere Coat",
    location: "Hải Phòng",
    timeAgo: "12 phút trước",
  },
  {
    id: "5",
    customerName: "Hoàng A.",
    productName: "Designer Sunglasses",
    location: "Cần Thơ",
    timeAgo: "15 phút trước",
  },
];

export function PurchaseToast() {
  const [currentNotification, setCurrentNotification] =
    useState<PurchaseNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [, setNotificationIndex] = useState(0);

  const showNextNotification = useCallback(() => {
    setNotificationIndex((prev) => {
      const nextIndex = (prev + 1) % fakePurchases.length;
      setCurrentNotification(fakePurchases[nextIndex]);
      setIsVisible(true);
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    // Delay ban đầu 10 giây trước khi hiển thị notification đầu tiên
    const initialDelay = setTimeout(() => {
      showNextNotification();
    }, 10000);

    return () => clearTimeout(initialDelay);
  }, [showNextNotification]);

  useEffect(() => {
    if (isVisible) {
      // Tự động ẩn sau 5 giây
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      // Hiển thị notification tiếp theo sau 15-25 giây
      const nextTimer = setTimeout(() => {
        showNextNotification();
      }, 15000 + Math.random() * 10000);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(nextTimer);
      };
    }
  }, [isVisible, showNextNotification]);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && currentNotification && (
        <m.div
          initial={{ opacity: 0, x: -100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-50 max-w-sm"
        >
          <div className="bg-white dark:bg-card rounded-xl shadow-2xl border border-neutral-200 dark:border-white/10 p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {currentNotification.customerName} từ{" "}
                {currentNotification.location}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                đã mua{" "}
                <span className="font-medium text-foreground">
                  {currentNotification.productName}
                </span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                {currentNotification.timeAgo}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
