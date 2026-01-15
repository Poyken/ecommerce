/**
 * =====================================================================
 * CHAT FEATURE TYPES - Type definitions cho Chat/Support system
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này định nghĩa các types cho Chat feature, bao gồm:
 * 1. Message types: Các loại tin nhắn (TEXT, IMAGE, PRODUCT, ORDER)
 * 2. UI Schema types: Cho AI-driven generative UI (Smart Widget)
 * 3. Socket response types: Responses từ WebSocket
 *
 * =====================================================================
 */

// =============================================================================
// 📨 MESSAGE TYPES
// =============================================================================

/**
 * Các loại tin nhắn hỗ trợ trong chat.
 */
export type ChatMessageType = "TEXT" | "IMAGE" | "PRODUCT" | "ORDER";

/**
 * Metadata cho message type = PRODUCT.
 */
export interface ProductMessageMetadata {
  productId: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
}

/**
 * Metadata cho message type = ORDER.
 */
export interface OrderMessageMetadata {
  orderId: string;
  orderStatus?: string;
  orderTotal?: number;
}

/**
 * Metadata cho message type = IMAGE.
 */
export interface ImageMessageMetadata {
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

/**
 * Union type cho tất cả metadata types.
 */
export type ChatMessageMetadata =
  | ProductMessageMetadata
  | OrderMessageMetadata
  | ImageMessageMetadata
  | Record<string, unknown>;

// =============================================================================
// 🔌 SOCKET TYPES
// =============================================================================

/**
 * Response từ socket emit callback.
 */
export interface SocketSendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// 🎨 SMART WIDGET / GENERATIVE UI TYPES
// =============================================================================

/**
 * Các loại widget UI có thể render.
 */
export type UISchemaType =
  | "stat_card"
  | "table"
  | "bar_chart"
  | "line_chart"
  | "pie_chart"
  | "alert"
  | "list";

/**
 * Data cho stat_card widget.
 */
export interface StatCardData {
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

/**
 * Column definition cho table widget.
 */
export interface TableColumn {
  key: string;
  label: string;
}

/**
 * Data cho table widget.
 */
export interface TableWidgetData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

/**
 * Data cho chart widgets (bar, line, pie).
 */
export interface ChartWidgetData {
  labels: string[];
  values: number[];
}

/**
 * Alert item trong alert widget.
 */
export interface AlertItem {
  product?: string;
  name?: string;
  stock: number;
}

/**
 * Data cho alert widget.
 */
export interface AlertWidgetData {
  level: "warning" | "error" | "info";
  message: string;
  items?: AlertItem[];
}

/**
 * Data cho list widget.
 */
export interface ListWidgetData {
  items: string[];
}

/**
 * Union type cho tất cả widget data types.
 */
export type UISchemaData =
  | StatCardData
  | TableWidgetData
  | ChartWidgetData
  | AlertWidgetData
  | ListWidgetData;

/**
 * Schema cho generative UI (Smart Widget).
 * AI trả về schema này, SmartWidget render tương ứng.
 *
 * Note: data là dynamic từ AI nên dùng generic type.
 * Mỗi widget component sẽ cast sang type cụ thể khi cần.
 */
export interface UISchema<T = unknown> {
  type: UISchemaType;
  title: string;
  data: T;
}
