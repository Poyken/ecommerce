/**
 * =====================================================================
 * AI AGENT PAGE - TRANG QUẢN TRỊ THÔNG MINH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Page này đóng vai trò là container cho AgentClient.
 * Giúp Admin tương tác với toàn bộ hệ thống bằng ngôn ngữ tự nhiên. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

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
