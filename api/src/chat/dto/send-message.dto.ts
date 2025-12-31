import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  toUserId?: string;

  @IsString()
  @IsOptional()
  clientTempId?: string;

  @IsEnum(['TEXT', 'IMAGE', 'PRODUCT', 'ORDER'])
  @IsOptional()
  type?: 'TEXT' | 'IMAGE' | 'PRODUCT' | 'ORDER';

  @IsObject()
  @IsOptional()
  metadata?: any;
}
