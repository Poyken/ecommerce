/**
 * =====================================================================
 * FORMAT UTILITIES - Hàm format dữ liệu chuyên dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SEPARATION OF CONCERNS:
 * - Tách riêng các hàm format ra khỏi utils chính để dễ quản lý.
 * - Khi cần sửa format tiền, chỉ cần vào file này.
 *
 * 2. INTL API:
 * - Sử dụng Intl API của JavaScript để format theo locale.
 * - Tự động xử lý dấu phẩy/chấm ngăn cách hàng nghìn đúng theo quốc gia.
 * =====================================================================
 */

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format số tiền thành tiền tệ Việt Nam (VND).
 * @param amount - Số tiền cần format
 * @returns Chuỗi đã format (VD: "100.000 ₫")
 */
export function formatVND(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    ...options,
  }).format(amount);
}

/**
 * Format số tiền thành USD.
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format số tiền động theo locale.
 */
export function formatCurrency(
  amount: number,
  locale = "vi-VN",
  currency = "VND"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format số tiền compact (VD: 1.5M, 2.3K)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(1)}B`;
  }
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(1)}M`;
  }
  if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(1)}K`;
  }
  return formatVND(amount);
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format số với dấu phân cách hàng nghìn.
 */
export function formatNumber(num: number, locale = "vi-VN"): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format phần trăm.
 */
export function formatPercent(
  value: number,
  decimals = 1,
  locale = "vi-VN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format số compact (1K, 1.5M, 2B)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================

/**
 * Format ngày theo chuẩn Việt Nam (DD/MM/YYYY).
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format ngày giờ đầy đủ.
 */
export function formatDateTime(date: Date | string | number): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Format thời gian tương đối (VD: "5 phút trước", "2 giờ trước").
 */
export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return "";

  const now = Date.now();
  const timestamp = new Date(date).getTime();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} năm trước`;
  if (months > 0) return `${months} tháng trước`;
  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return "Vừa xong";
}

/**
 * Format khoảng thời gian (VD: "2 giờ 30 phút").
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} ngày ${hours % 24} giờ`;
  }
  if (hours > 0) {
    return `${hours} giờ ${minutes % 60} phút`;
  }
  if (minutes > 0) {
    return `${minutes} phút ${seconds % 60} giây`;
  }
  return `${seconds} giây`;
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Truncate text với ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Capitalize từ đầu tiên.
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalize tất cả các từ.
 */
export function capitalizeWords(text: string): string {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Chuyển đổi chuỗi thành slug URL-friendly.
 */
export function toSlug(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format số điện thoại VN (VD: 0912 345 678).
 */
export function formatPhoneVN(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
}

// ============================================================================
// FILE SIZE FORMATTING
// ============================================================================

/**
 * Format kích thước file (VD: "1.5 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// ORDER/ID FORMATTING
// ============================================================================

/**
 * Format mã đơn hàng (VD: ORD-20240115-ABC123).
 */
export function formatOrderId(id: string, prefix = "ORD"): string {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

/**
 * Mask thông tin nhạy cảm (VD: email -> t***@gmail.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const maskedLocal = local.charAt(0) + "***";
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask số điện thoại (VD: 0912***678).
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const start = phone.slice(0, 4);
  const end = phone.slice(-3);
  return `${start}***${end}`;
}
