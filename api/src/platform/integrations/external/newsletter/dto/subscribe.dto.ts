import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * SUBSCRIBE DTO - Đối tượng đăng ký nhận tin
 * =====================================================================
 *
 * =====================================================================
 */

const SubscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .describe('Email đăng ký nhận tin'),
});

export class SubscribeDto extends createZodDto(SubscribeSchema) {}
