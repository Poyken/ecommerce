import { Logger } from '@nestjs/common';

/**
 * =====================================================================
 * CIRCUIT BREAKER - BỘ NGẮT MẠCH (Phòng chống lỗi dây chuyền)
 * =====================================================================
 *
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
