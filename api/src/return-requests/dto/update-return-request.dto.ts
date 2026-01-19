import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ReturnStatus } from '@prisma/client';
import { CreateReturnRequestSchema } from './create-return-request.dto';

const UpdateReturnRequestSchema = CreateReturnRequestSchema.partial().extend({
  status: z.nativeEnum(ReturnStatus).optional(),
  inspectionNotes: z.string().optional(),
  rejectedReason: z.string().optional(),
});

export class UpdateReturnRequestDto extends createZodDto(
  UpdateReturnRequestSchema,
) {}
