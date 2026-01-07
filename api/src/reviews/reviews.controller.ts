import { CloudinaryService } from '@integrations/cloudinary/cloudinary.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
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
import { ApiConsumes } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

/**
 * =====================================================================
 * REVIEWS CONTROLLER - Điều hướng yêu cầu về đánh giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESS CONTROL (Kiểm soát truy cập):
 * - `findAll` và `remove` (Admin): Yêu cầu cả `JwtAuthGuard` và `PermissionsGuard` để đảm bảo chỉ Admin có quyền mới được quản lý review.
 * - `create`, `update`, `removeOwn` (User): Chỉ yêu cầu `JwtAuthGuard` vì đây là quyền cơ bản của mọi người dùng đã đăng nhập.
 *
 * 2. CUSTOM DECORATORS:
 * - `@GetUser('id')`: Một decorator tự chế giúp lấy ID người dùng trực tiếp từ Token, làm code sạch hơn so với việc dùng `req.user.id`.
 *
 * 3. PUBLIC VS PRIVATE ROUTES:
 * - `findAllByProduct`: Là route công khai (Public), không cần Guard, giúp khách vãng lai cũng có thể đọc được các đánh giá sản phẩm.
 * =====================================================================
 */
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả đánh giá (Admin)' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('rating') rating?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.reviewsService.findAll(
      Number(page),
      Number(limit),
      rating ? Number(rating) : undefined,
      status,
      search,
    );
    return data; // Service returns { data, meta }
  }

  @Post()
  @UseGuards(JwtAuthGuard) // Chỉ cần Login là được, không cần quyền đặc biệt
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gửi đánh giá (Phải đã mua sản phẩm & ĐÃ GIAO HÀNG)',
  })
  async create(
    @GetUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const data = await this.reviewsService.create(userId, createReviewDto);
    return { data };
  }

  @Get('check-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra quyền đánh giá' })
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000) // 1 minute
  @ApiOperation({ summary: 'Lấy đánh giá theo sản phẩm' })
  async findAllByProduct(
    @Param('productId') productId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 10,
  ) {
    const data = await this.reviewsService.findAllByProduct(
      productId,
      cursor,
      Number(limit),
    );
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá (Admin)' })
  async remove(@Param('id') id: string) {
    const data = await this.reviewsService.remove(id);
    return { data };
  }

  @Delete('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá của tôi' })
  async removeOwn(@GetUser('id') userId: string, @Param('id') id: string) {
    const data = await this.reviewsService.removeOwn(userId, id);
    return { data };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review status (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    const data = await this.reviewsService.updateStatus(id, isApproved);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
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
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload review images' })
  async uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploaded = await Promise.all(
      files.map((file) => this.cloudinaryService.uploadImage(file)),
    );
    const urls = uploaded.map((res) => res.secure_url);
    return { data: urls };
  }
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trả lời đánh giá (Admin)' })
  async reply(@Param('id') id: string, @Body('reply') reply: string) {
    const data = await this.reviewsService.replyToReview(id, reply);
    return { data };
  }
}
