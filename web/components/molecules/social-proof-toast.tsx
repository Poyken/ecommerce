"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/atoms/avatar";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * SOCIAL PROOF TOAST - Thông báo tạo niềm tin khách hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SOCIAL PROOF & FOMO:
 * - Kỹ thuật marketing: Hiển thị "người khác đang mua" để tạo hiệu ứng đám đông (Social Proof) và sợ bỏ lỡ (FOMO).
 * - Tăng tỷ lệ chuyển đổi (Conversion Rate) đáng kể trên các trang E-commerce.
 *
 * 2. RECURSIVE TIMEOUTS (Timer đệ quy):
 * - Thay vì `setInterval` cố định 10s -> Ta dùng `setTimeout` lồng nhau.
 * - Lợi ích: Có thể random thời gian chờ (Lúc thì 10s, lúc thì 20s) -> Tạo cảm giác tự nhiên hơn ("Randomness").
 *
 * 3. CLEANUP IS CRITICAL:
 * - Phải lưu lại tất cả `timeoutId` để `clearTimeout` khi component unmount.
 * - Nếu không, khi user chuyển trang, toast vẫn hiện lên -> Gây khó chịu và lỗi memory leak.
 * =====================================================================
 */

const MESSAGES = [
  "Someone in Hanoi just bought this",
  "3 people are viewing this right now",
  "Last purchased 5 minutes ago",
  "High demand: Only 4 left in stock",
];

const NAMES = ["Linh", "Minh", "Ha", "Sarah", "John"];

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    // Track all timeout IDs for cleanup
    const timeoutIds: NodeJS.Timeout[] = [];

    const showRandomMessage = () => {
      const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      setMessage(randomMsg);
      setName(randomName);
      setVisible(true);

      // Hide after 5 seconds
      const hideTimeout = setTimeout(() => {
        setVisible(false);

        // Schedule next message after random interval (10-20s)
        const nextTimeout = setTimeout(
          showRandomMessage,
          10000 + Math.random() * 10000
        );
        timeoutIds.push(nextTimeout);
      }, 5000);

      timeoutIds.push(hideTimeout);
    };

    // Show first message after 3 seconds
    const initialTimeout = setTimeout(showRandomMessage, 3000);
    timeoutIds.push(initialTimeout);

    // Cleanup all timeouts on unmount
    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 0 }}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-4 p-4 pr-6 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-sm"
        >
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={`/images/avatars/${name}.svg`} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse"></span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {message.includes("bought")
                ? `${name} from Hanoi`
                : "Trending Now"}
            </p>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
