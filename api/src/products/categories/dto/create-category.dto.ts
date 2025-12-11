import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'electronics', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'uuid-parent-id', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;
}
