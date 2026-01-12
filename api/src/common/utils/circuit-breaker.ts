import { Logger } from '@nestjs/common';

/**
 * =====================================================================
 * CIRCUIT BREAKER - BỘ NGẮT MẠCH (Phòng chống lỗi dây chuyền)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO PHẢI DÙNG?
 * - Khi gọi một service bên thứ 3 (như GHN hoặc Cổng thanh toán), nếu họ đang bảo trì hoặc sập,
 *   mà ta cứ tiếp tục gửi request lên, hệ thống của ta sẽ bị treo (vì phải chờ timeout)
 *   và có thể làm sập luôn toàn bộ server của mình.
 *
 * 2. CÁC TRẠNG THÁI (STATES):
 * - CLOSED (Đóng): Bình thường, cho phép request đi qua.
 * - OPEN (Mở): Phát hiện lỗi quá nhiều -> Ngắt mạch, trả về lỗi ngay lập tức (Fail Fast),
 *   không gửi request đi nữa để đối tác có thời gian hồi phục.
 * - HALF_OPEN (Nửa mở): Sau một thời gian, cho phép 1 vài request đi qua để "thử" xem đối tác đã sống lại chưa.
 *
 * 3. THÔNG SỐ:
 * - failureThreshold: Số lỗi tối đa trước khi ngắt mạch (VD: 5 lỗi).
 * - resetTimeout: Thời gian chờ trước khi thử lại (VD: 30 giây). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cung cấp các hàm tiện ích dùng chung, giúp code gọn gàng và tái sử dụng hiệu quả.

 * =====================================================================
 */

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private nextRetryTime = 0;
  private readonly logger = new Logger('CircuitBreaker');

  constructor(
    private readonly serviceName: string,
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 30000, // 30s
  ) {}

  async execute<T>(action: () => Promise<T>, fallbackValue?: T): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextRetryTime) {
        this.state = CircuitState.HALF_OPEN;
        this.logger.warn(
          `[${this.serviceName}] Mạch đang ở trạng thái HALF-OPEN. Đang thử kết nối lại...`,
        );
      } else {
        this.logger.error(
          `[${this.serviceName}] Mạch đang MỞ (OPEN). Từ chối thực thi nhanh (Fast Fail)...`,
        );
        if (fallbackValue !== undefined) return fallbackValue;
        throw new Error(
          `Dịch vụ ${this.serviceName} tạm thời không khả dụng (Circuit Open)`,
        );
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      if (fallbackValue !== undefined) return fallbackValue;
      throw error;
    }
  }

  private onSuccess() {
    if (this.state !== CircuitState.CLOSED) {
      this.logger.log(
        `[${this.serviceName}] ✅ Dịch vụ đã hồi phục! Mạch đã ĐÓNG (CLOSED) trở lại.`,
      );
    }
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: unknown) {
    this.failureCount++;
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `[${this.serviceName}] ❌ Số lần lỗi: ${this.failureCount}. Lỗi: ${message}`,
    );

    if (
      this.failureCount >= this.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.state = CircuitState.OPEN;
      this.nextRetryTime = Date.now() + this.resetTimeoutMs;
      this.logger.error(
        `[${this.serviceName}] 🚨 Mạch đã MỞ (OPEN). Dịch vụ sẽ bị vô hiệu hóa trong ${
          this.resetTimeoutMs / 1000
        } giây`,
      );
    }
  }
}
