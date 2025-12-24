import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'new_checkout_flow' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Enable the new checkout UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ example: { percentage: 50 } })
  @IsOptional()
  rules?: any;
}

export class UpdateFeatureFlagDto {
  @ApiProperty({ example: 'Enable the new checkout UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ example: { percentage: 100 } })
  @IsOptional()
  rules?: any;
}
