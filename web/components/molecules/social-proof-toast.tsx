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
 * 1. SOCIAL PROOF (Bằng chứng xã hội):
 * - Kỹ thuật marketing hiển thị các thông báo "giả lập" hoặc thật về hoạt động của người dùng khác.
 * - Mục đích: Tạo cảm giác sản phẩm đang "hot", kích thích tâm lý mua hàng (FOMO).
 *
 * 2. RANDOMIZATION LOGIC:
 * - Sử dụng `setTimeout` lồng nhau để hiển thị thông báo sau các khoảng thời gian ngẫu nhiên (10-20 giây).
 * - `MESSAGES` và `NAMES` được chọn ngẫu nhiên để tạo cảm giác tự nhiên.
 *
 * 3. CLEANUP:
 * - Rất quan trọng: Phải `clearTimeout` tất cả các timer khi component unmount để tránh lỗi logic hoặc memory leak.
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
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
              />
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
