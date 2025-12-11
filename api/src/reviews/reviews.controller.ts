import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả đánh giá (Admin)' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.reviewsService.findAll(Number(page), Number(limit));
  }

  @Post()
  @UseGuards(JwtAuthGuard) // Chỉ cần Login là được, không cần quyền đặc biệt
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gửi đánh giá (Phải đã mua sản phẩm & ĐÃ GIAO HÀNG)',
  })
  create(
    @GetUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('check-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra quyền đánh giá' })
  checkEligibility(
    @GetUser('id') userId: string,
    @Query('productId') productId: string,
  ) {
    return this.reviewsService.checkEligibility(userId, productId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lấy đánh giá theo sản phẩm' })
  findAllByProduct(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.findAllByProduct(
      productId,
      Number(page),
      Number(limit),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá (Admin)' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  @Delete('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá của tôi' })
  removeOwn(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.reviewsService.removeOwn(userId, id);
  }



  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, id, updateReviewDto);
  }
}
