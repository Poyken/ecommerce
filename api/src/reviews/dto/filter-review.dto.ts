import { PaginationQueryDto } from '@/common/dto/base.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterReviewDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Lọc theo số sao (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    example: 'published',
    enum: ['published', 'hidden', 'all'],
    description: 'Trạng thái hiển thị',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo nội dung, email hoặc tên',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
