# AI Agent Architecture & Real-world Implementation

> **Goal**: Từ "Chatbot hỏi đáp" thành "Trợ lý hành động" (Autonomous Agent).
> **Stack**: NestJS + Gemini 1.5 Pro + pgvector + BullMQ.

---

## 1. Hiện trạng & Cách triển khai thực tế

### 1.1 Level 1: RAG (Retrieval-Augmented Generation)

_Hiện tại dự án đang ở level này._

- **Cơ chế**: User hỏi "Có áo thun đen không?" -> Hệ thống tìm trong Vector DB -> Lấy thông tin SP -> Gửi cho AI -> AI trả lời.
- **Thực tế triển khai**:
  - Dùng **pgvector** (trên Neon/Supabase) để lưu embeddings của tên/mô tả sản phẩm.
  - Khi Admin tạo/sửa SP -> Bắn job vào **BullMQ** để cập nhật vector (tránh làm chậm API).
  - Webhook từ CMS -> Cập nhật Knowledge Base cho AI.

### 1.2 Level 2: Agentic Workflow (Function Calling)

_Mục tiêu nâng cấp tiếp theo._

- **Cơ chế**: AI không chỉ trả lời, mà có thể _gọi hàm_.
- **Ví dụ**: User nói "Kiểm tra đơn hàng #123 giúp tôi".
  - AI nhận diện intent -> Gọi function `getOrderStatus("123")`.
  - API trả về status -> AI trả lời "Đơn hàng đang giao, dự kiến mai tới".
- **Real-world**:
  - Các bên đang dùng **Gemini Function Calling** hoặc **OpenAI Tools**.
  - Cần define một `AgentRegistry` chứa list các tools (GetOrder, SearchProduct, CancelOrder) với Zod Schema mô tả input.

---

## 2. Chiến lược Vận hành AI (Ops)

### 2.1 Chi phí & Latency

- **Embeddings**: Chỉ tính toán lại khi data thay đổi (dùng hash check).
- **Caching**: Cache câu trả lời cho các câu hỏi phổ biến (Semantic Cache).
- **Fallback**: Luôn có cơ chế fallback về "Search thường" nếu AI lỗi hoặc quá chậm (>5s).

### 2.2 Human-in-the-loop

- **Review**: Lưu lịch sử chat (`AiChatSession`) để PM review định kỳ.
- **Feedback**: Nút Like/Dislike câu trả lời của AI để finetune prompt.

---

## 3. Implementation Roadmap (Dự án này)

```typescript
// services/ai-agent.service.ts
async processMessage(userId: string, message: string) {
  // 1. Identify Intent (Chat vs Action)
  // 2. If Action -> Execute Tool (e.g. OrderService.find())
  // 3. If Chat -> RAG (Vector Search)
  // 4. Generate Response
}
```

- **Bước 1**: Chuẩn hóa `OrderService`, `ProductService` để AI có thể gọi ("Safe Tools").
- **Bước 2**: Định nghĩa `ToolDefinitions` (JSON Schema) gửi cho Gemini.
- **Bước 3**: Xử lý `ToolCall` response từ Gemini, thực thi hàm, và gửi kết quả lại cho AI.
