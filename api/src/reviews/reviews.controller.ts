/**
 * =====================================================================
 * REVIEWS CONTROLLER - API Đánh giá sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ELIGIBILITY CHECK (`check-eligibility`):
 * - Trước khi cho user viết review, phải kiểm tra:
 *   + User đã mua sản phẩm này chưa?
 *   + Đơn hàng đã giao thành công chưa?
 *   + Đã review sản phẩm này trước đó chưa?
 *
 * 2. MEDIA UPLOAD:
 * - Endpoint `upload` cho phép upload ảnh/video đính kèm review.
 * - Sử dụng `FilesInterceptor` để xử lý multipart/form-data. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import { CloudinaryService } from '@integrations/cloudinary/cloudinary.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';
import { AiSentimentService } from './ai-sentiment.service';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  ApiListResponse,
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiUpdateResponse,
  ApiGetOneResponse,
  Cached,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';

/**
 * =====================================================================
 * REVIEWS CONTROLLER - Điều hướng yêu cầu về đánh giá
 * =====================================================================
 */

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly aiSentimentService: AiSentimentService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('review:read')
  @ApiListResponse('Review', { summary: 'Get all reviews (Admin)' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('rating') rating?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAll(
      Number(page),
      Number(limit),
      rating ? Number(rating) : undefined,
      status,
      search,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateResponse('Review', { summary: 'Gửi đánh giá' })
  async create(
    @GetUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const data = await this.reviewsService.create(userId, createReviewDto);
    return { data };
  }

  @Get('check-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiGetOneResponse('Boolean', { summary: 'Kiểm tra quyền đánh giá' })
  async checkEligibility(
    @GetUser('id') userId: string,
    @Query('productId') productId: string,
  ) {
    try {
      const data = await this.reviewsService.checkEligibility(
        userId,
        productId,
      );
      return { data };
    } catch (e) {
      console.error('[CheckEligibility Error]', e);
      throw e;
    }
  }

  @Get('product/:productId')
  @Cached(60) // 1 minute
  @ApiListResponse('Review', { summary: 'Lấy đánh giá theo sản phẩm' })
  async findAllByProduct(
    @Param('productId') productId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.findAllByProduct(
      productId,
      cursor,
      Number(limit),
    );
  }

  // =====================================================================
  // AI SENTIMENT ENDPOINTS
  // =====================================================================

  @Get('product/:productId/sentiment')
  @Cached(300) // 5 minutes
  @ApiOperation({ summary: 'Lấy thống kê sentiment của sản phẩm (AI)' })
  async getProductSentiment(@Param('productId') productId: string) {
    const [stats, topTags] = await Promise.all([
      this.aiSentimentService.getProductSentimentStats(productId),
      this.aiSentimentService.getProductTopTags(productId),
    ]);
    return { data: { stats, topTags } };
  }

  @Get('product/:productId/insights')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('review:read')
  @Cached(600) // 10 minutes
  @ApiOperation({ summary: 'Lấy AI insights cho sản phẩm (Admin)' })
  async getProductInsights(@Param('productId') productId: string) {
    const insights =
      await this.aiSentimentService.generateProductInsights(productId);
    return { data: { insights } };
  }

  @Post('analyze-batch')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('review:update')
  @ApiOperation({
    summary: 'Phân tích hàng loạt reviews chưa có sentiment (Admin)',
  })
  async analyzeUnanalyzedReviews(@Query('limit') limit = 20) {
    const unanalyzed = await this.aiSentimentService.getUnanalyzedReviews(
      Number(limit),
    );
    const results = await this.aiSentimentService.analyzeMultipleReviews(
      unanalyzed.map((r) => r.id),
    );
    return {
      data: {
        analyzed: Object.keys(results).length,
        remaining: unanalyzed.length - Object.keys(results).length,
      },
    };
  }

  // =====================================================================
  // OTHER ENDPOINTS
  // =====================================================================

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('review:delete')
  @ApiDeleteResponse('Review', { summary: 'Xóa đánh giá (Admin)' })
  async remove(@Param('id') id: string) {
    const data = await this.reviewsService.remove(id);
    return { data };
  }

  @Delete('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiDeleteResponse('Review', { summary: 'Xóa đánh giá của tôi' })
  async removeOwn(@GetUser('id') userId: string, @Param('id') id: string) {
    const data = await this.reviewsService.removeOwn(userId, id);
    return { data };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('review:update')
  @ApiUpdateResponse('Review', { summary: 'Update review status (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    const data = await this.reviewsService.updateStatus(id, isApproved);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateResponse('Review', { summary: 'Cập nhật đánh giá' })
  async update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const data = await this.reviewsService.update(userId, id, updateReviewDto);
    return { data };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('String', { summary: 'Upload review images' })
  async uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploaded = await Promise.all(
      files.map((file) => this.cloudinaryService.uploadImage(file)),
    );
    const urls = uploaded.map((res) => res.secure_url);
    return { data: urls };
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('review:update')
  @ApiUpdateResponse('Review', { summary: 'Trả lời đánh giá (Admin)' })
  async reply(@Param('id') id: string, @Body('reply') reply: string) {
    const data = await this.reviewsService.replyToReview(id, reply);
    return { data };
  }
}
