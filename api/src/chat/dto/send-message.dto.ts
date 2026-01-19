import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SendMessageSchema = z.object({
  content: z.string().min(1),
  toUserId: z.string().optional(),
  clientTempId: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'PRODUCT', 'ORDER']).optional(),
  metadata: z.any().optional(),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {}
