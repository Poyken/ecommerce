import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * =====================================================================
 * CORRELATION ID MIDDLEWARE - THEO DÕI REQUEST XUYÊN SUỐT HỆ THỐNG
 * =====================================================================
 *
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
