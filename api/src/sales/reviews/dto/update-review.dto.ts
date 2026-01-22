import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';

/**
 * =====================================================================
 * UPDATE REVIEW DTO - Đối tượng cập nhật đánh giá
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
