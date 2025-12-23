import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * =====================================================================
 * JWT AUTH GUARD - Lớp bảo vệ API bằng mã JWT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GUARD (Người gác cổng):
 * - Guard là lớp phòng thủ đầu tiên của một API. Nó quyết định xem request có được phép đi tiếp vào Controller hay không.
 *
 * 2. PASSPORT INTEGRATION:
 * - `AuthGuard('jwt')` kế thừa logic từ thư viện Passport.
 * - Nó sẽ tự động tìm mã JWT trong Header `Authorization: Bearer <token>`, giải mã và kiểm tra tính hợp lệ.
 *
 * 3. AUTOMATIC USER ATTACHMENT:
 * - Nếu token hợp lệ, Guard này sẽ gán thông tin người dùng vào `request.user`, giúp các bước sau (như Decorator `@GetUser`) có thể sử dụng.
 * =====================================================================
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
