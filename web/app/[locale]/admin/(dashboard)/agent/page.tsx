/**
 * =====================================================================
 * AI AGENT PAGE - TRANG QUẢN TRỊ THÔNG MINH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Page này đóng vai trò là container cho AgentClient.
 * Giúp Admin tương tác với toàn bộ hệ thống bằng ngôn ngữ tự nhiên.
 * =====================================================================
 */

import { AgentClient } from "./agent-client";

export default function AgentPage() {
  return (
    <div className="container mx-auto">
      <AgentClient />
    </div>
  );
}
