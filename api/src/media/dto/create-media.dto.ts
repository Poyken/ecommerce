import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  url: string; // URL của file sau khi upload lên Storage (S3/Cloudinary)

  @IsString()
  type: string; // image, video, document

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  size?: number;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;
}
