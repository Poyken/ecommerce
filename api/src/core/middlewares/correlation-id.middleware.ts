import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * =====================================================================
 * CORRELATION ID MIDDLEWARE - THEO DÕI REQUEST XUYÊN SUỐT HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CORRELATION ID LÀ GÌ?
 * - Một ID duy nhất được gán cho mỗi request ngay từ khi vào hệ thống.
 * - ID này được truyền qua tất cả các service, log, và database calls.
 * - Giúp debug production issues dễ dàng: "Tìm tất cả log có correlationId = X"
 *
 * 2. HEADER STANDARDS:
 * - X-Correlation-ID: ID do client gửi (nếu có) hoặc server tự tạo
 * - X-Request-ID: Alias phổ biến khác
 *
 * 3. PROPAGATION:
 * - Middleware này sẽ:
 *   a) Đọc correlation ID từ header nếu client đã gửi
 *   b) Tạo mới nếu chưa có
 *   c) Gắn vào request object để các service khác sử dụng
 *   d) Thêm vào response header để client biết
 *
 * 4. BEST PRACTICES (2024):
 * - Dùng UUID v4 để đảm bảo uniqueness
 * - Luôn log correlation ID trong mọi log entry
 * - Truyền qua HTTP headers khi call service khác *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Distributed Tracing: Theo dõi hành trình của một request đi qua nhiều Microservices hoặc layers (Gateway -> Auth -> Product -> Database).
 * - Faster Debugging: Khi khách hàng báo lỗi, chỉ cần xin `correlationId` (thường hiện ở popup lỗi) là dev truy ra ngay log liên quan.
 *.Support Desk: Giúp team CSKH có mã tham chiếu để báo lại cho team kỹ thuật.

 * =====================================================================
 */

// Header names (theo W3C Trace Context và industry standards)
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

// Key để lưu trong request object
export const CORRELATION_ID_KEY = 'correlationId';

// Augment Express Request type to include correlationId
declare module 'express' {
  interface Request {
    correlationId: string;
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Lấy correlation ID từ request header (nếu client đã gửi)
    let correlationId =
      req.get(CORRELATION_ID_HEADER) || req.get(REQUEST_ID_HEADER);

    // 2. Nếu không có, tạo mới bằng UUID v4
    if (!correlationId) {
      correlationId = randomUUID();
    }

    // 3. Gắn vào request object để các service có thể truy cập
    req.correlationId = correlationId;

    // 4. Thêm vào response header để client có thể track
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, correlationId);

    next();
  }
}
