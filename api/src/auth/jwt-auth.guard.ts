/**
 * =====================================================================
 * JWT AUTH GUARD - Bảo vệ Route bằng JWT Token
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CƠ CHẾ HOẠT ĐỘNG:
 * - Đây là "người gác cổng" (Guard) mặc định của NestJS Passport.
 * - Khi gắn `@UseGuards(JwtAuthGuard)` lên controller hoặc method:
 *   + Nó sẽ check Header `Authorization: Bearer <token>`.
 *   + Nếu token valid -> Cho qua & gán `req.user`.
 *   + Nếu token invalid/expired -> Trả về 401 Unauthorized ngay lập tức.
 *
 * 2. SỬ DỤNG:
 * - Hầu hết các API private đều phải có guard này.
 * =====================================================================
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
