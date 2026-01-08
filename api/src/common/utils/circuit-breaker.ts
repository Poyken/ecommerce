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
 * - resetTimeout: Thời gian chờ trước khi thử lại (VD: 30 giây).
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
          `[${this.serviceName}] Circuit is HALF-OPEN. Testing service...`,
        );
      } else {
        this.logger.error(
          `[${this.serviceName}] Circuit is OPEN. Fast failing...`,
        );
        if (fallbackValue !== undefined) return fallbackValue;
        throw new Error(
          `Service ${this.serviceName} is temporarily unavailable (Circuit Open)`,
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
        `[${this.serviceName}] ✅ Service recovered! Circuit is now CLOSED.`,
      );
    }
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: any) {
    this.failureCount++;
    this.logger.error(
      `[${this.serviceName}] ❌ Failure count: ${this.failureCount}. Error: ${error.message}`,
    );

    if (
      this.failureCount >= this.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.state = CircuitState.OPEN;
      this.nextRetryTime = Date.now() + this.resetTimeoutMs;
      this.logger.error(
        `[${this.serviceName}] 🚨 Circuit is now OPEN. Service will be ignored for ${
          this.resetTimeoutMs / 1000
        }s`,
      );
    }
  }

  // Helper to check current state
  getState() {
    return CircuitState[this.state];
  }
}
