import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto, stringToBoolean } from '@/common/dto/base.dto';

export class FilterNotificationDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID User' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Loại thông báo (VD: ORDER, SYSTEM)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Trình trạng đã đọc' })
  @IsOptional()
  @Transform(({ value }) => stringToBoolean(value))
  @IsBoolean()
  isRead?: boolean;
}
