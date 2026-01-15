import { PartialType } from '@nestjs/swagger';
import { CreateReturnRequestDto } from './create-return-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnStatus } from '@prisma/client';

export class UpdateReturnRequestDto extends PartialType(
  CreateReturnRequestDto,
) {
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @IsString()
  inspectionNotes?: string;

  @IsOptional()
  @IsString()
  rejectedReason?: string;
}
