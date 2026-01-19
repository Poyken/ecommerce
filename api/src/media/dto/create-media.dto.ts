import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMediaSchema = z.object({
  url: z.string(),
  type: z.string(),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
  altText: z.string().optional(),
  size: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

export class CreateMediaDto extends createZodDto(CreateMediaSchema) {}
