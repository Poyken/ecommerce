export enum OrderStatus {
  PENDING = 'PENDING', // Chờ thanh toán/xác nhận
  CONFIRMED = 'CONFIRMED', // Đã xác nhận
  PROCESSING = 'PROCESSING', // Đang xử lý/đóng gói
  SHIPPED = 'SHIPPED', // Đang giao hàng
  DELIVERED = 'DELIVERED', // Đã giao thành công
  CANCELLED = 'CANCELLED', // Đã hủy
  RETURNED = 'RETURNED', // Đã trả hàng
  REFUNDED = 'REFUNDED', // Đã hoàn tiền
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}
