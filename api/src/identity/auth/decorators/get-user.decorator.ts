import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * =====================================================================
 * GET USER DECORATOR - Decorator lấy thông tin người dùng từ Request
 * =====================================================================
 *
 * =====================================================================
 */

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
