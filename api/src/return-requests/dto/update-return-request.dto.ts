import { PartialType } from '@nestjs/swagger';
import { CreateReturnRequestDto } from './create-return-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  WAITING_FOR_RETURN = 'WAITING_FOR_RETURN',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  INSPECTING = 'INSPECTING', // Admin is checking items
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

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
