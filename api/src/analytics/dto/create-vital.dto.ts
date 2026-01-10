/**
 * =====================================================================
 * CREATE VITAL DTO - Web Vitals Data Object
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GOOGLE WEB VITALS:
 * - Đây là các chỉ số đo lường UX do Google định nghĩa.
 * - FCP (First Contentful Paint): Tốc độ hiển thị.
 * - LCP (Largest Contentful Paint): Tốc độ hiển thị nội dung chính.
 * - CLS (Cumulative Layout Shift): Độ ổn định giao diện.
 * - INP (Interaction to Next Paint): Độ phản hồi.
 *
 * 2. DATA COLLECTION:
 * - DTO này định nghĩa cấu trúc dữ liệu mà Frontend gửi về để Server lưu trữ.
 * =====================================================================
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVitalDto {
  @ApiProperty({ description: 'Metric ID (v2-...)', required: false })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Metric Name (FCP, LCP, CLS, TTFB, FID, INP)',
    example: 'FCP',
  })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metric Value', example: 123.45 })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Metric Rating (good, needs-improvement, poor)',
    example: 'good',
  })
  @IsString()
  rating: string;

  @ApiProperty({
    description: 'Navigation Type (navigate, reload, back_forward)',
    required: false,
  })
  @IsString()
  @IsOptional()
  navigationType?: string;

  @ApiProperty({ description: 'User Agent', required: false })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ description: 'Page URL', required: false })
  @IsString()
  @IsOptional()
  url?: string;
}
