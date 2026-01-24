import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * =====================================================================
 * OPTIONAL JWT AUTH GUARD - XÁC THỰC TÙY CHỌN
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest so that it doesn't throw an error if user is not found
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
