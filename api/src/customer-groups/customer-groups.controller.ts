import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerGroupsService } from './customer-groups.service';
import {
  CreateCustomerGroupDto,
  UpdateCustomerGroupDto,
  CreatePriceListDto,
  UpdatePriceListDto,
  AddPriceListItemDto,
} from './dto/customer-group.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { GetUser } from '@/auth/decorators/get-user.decorator';

/**
 * =====================================================================
 * B2B PRICING CONTROLLER
 * =====================================================================
 *
 * Endpoints:
 *
 * Customer Groups:
 * - GET    /b2b/groups               - Danh sách nhóm
 * - POST   /b2b/groups               - Tạo nhóm mới
 * - GET    /b2b/groups/:id           - Chi tiết nhóm
 * - PUT    /b2b/groups/:id           - Cập nhật nhóm
 * - DELETE /b2b/groups/:id           - Xóa nhóm
 * - POST   /b2b/groups/:id/users/:userId - Thêm user vào nhóm
 * - DELETE /b2b/groups/users/:userId - Xóa user khỏi nhóm
 *
 * Price Lists:
 * - GET    /b2b/price-lists          - Danh sách bảng giá
 * - POST   /b2b/price-lists          - Tạo bảng giá mới
 * - GET    /b2b/price-lists/:id      - Chi tiết bảng giá
 * - PUT    /b2b/price-lists/:id      - Cập nhật bảng giá
 * - DELETE /b2b/price-lists/:id      - Xóa bảng giá
 * - POST   /b2b/price-lists/:id/items - Thêm/Cập nhật giá SKU
 * - DELETE /b2b/price-lists/:id/items/:skuId - Xóa giá SKU
 * - POST   /b2b/price-lists/:id/assign/:groupId - Gán bảng giá cho nhóm
 *
 * Pricing:
 * - GET    /b2b/my-prices            - Lấy bảng giá của tôi
 * - GET    /b2b/prices/:skuId        - Lấy giá cho một SKU
 * - POST   /b2b/prices               - Lấy giá cho nhiều SKUs
 *
 * =====================================================================
 */
@ApiTags('B2B Pricing')
@ApiBearerAuth()
@Controller('b2b')
@UseGuards(JwtAuthGuard)
export class CustomerGroupsController {
  constructor(private readonly service: CustomerGroupsService) {}

  // =====================================================================
  // CUSTOMER GROUPS
  // =====================================================================

  @Get('groups')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:read')
  @ApiOperation({ summary: 'Danh sách nhóm khách hàng' })
  findAllGroups() {
    return this.service.findAllGroups();
  }

  @Post('groups')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:create')
  @ApiOperation({ summary: 'Tạo nhóm khách hàng mới' })
  createGroup(@Body() dto: CreateCustomerGroupDto) {
    return this.service.createGroup(dto);
  }

  @Get('groups/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:read')
  @ApiOperation({ summary: 'Chi tiết nhóm khách hàng' })
  findOneGroup(@Param('id') id: string) {
    return this.service.findOneGroup(id);
  }

  @Put('groups/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:update')
  @ApiOperation({ summary: 'Cập nhật nhóm khách hàng' })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateCustomerGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:delete')
  @ApiOperation({ summary: 'Xóa nhóm khách hàng' })
  deleteGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }

  @Post('groups/:id/users/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:update')
  @ApiOperation({ summary: 'Thêm user vào nhóm' })
  addUserToGroup(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.addUserToGroup(groupId, userId);
  }

  @Delete('groups/users/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:update')
  @ApiOperation({ summary: 'Xóa user khỏi nhóm' })
  removeUserFromGroup(@Param('userId') userId: string) {
    return this.service.removeUserFromGroup(userId);
  }

  // =====================================================================
  // PRICE LISTS
  // =====================================================================

  @Get('price-lists')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:read')
  @ApiOperation({ summary: 'Danh sách bảng giá' })
  findAllPriceLists() {
    return this.service.findAllPriceLists();
  }

  @Post('price-lists')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:create')
  @ApiOperation({ summary: 'Tạo bảng giá mới' })
  createPriceList(@Body() dto: CreatePriceListDto) {
    return this.service.createPriceList(dto);
  }

  @Get('price-lists/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:read')
  @ApiOperation({ summary: 'Chi tiết bảng giá' })
  findOnePriceList(@Param('id') id: string) {
    return this.service.findOnePriceList(id);
  }

  @Put('price-lists/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:update')
  @ApiOperation({ summary: 'Cập nhật bảng giá' })
  updatePriceList(@Param('id') id: string, @Body() dto: UpdatePriceListDto) {
    return this.service.updatePriceList(id, dto);
  }

  @Delete('price-lists/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:delete')
  @ApiOperation({ summary: 'Xóa bảng giá' })
  deletePriceList(@Param('id') id: string) {
    return this.service.deletePriceList(id);
  }

  @Post('price-lists/:id/items')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:update')
  @ApiOperation({ summary: 'Thêm/Cập nhật giá SKU trong bảng giá' })
  addPriceListItem(
    @Param('id') priceListId: string,
    @Body() dto: AddPriceListItemDto,
  ) {
    return this.service.addPriceListItem(priceListId, dto);
  }

  @Delete('price-lists/:id/items/:skuId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:update')
  @ApiOperation({ summary: 'Xóa giá SKU khỏi bảng giá' })
  removePriceListItem(
    @Param('id') priceListId: string,
    @Param('skuId') skuId: string,
  ) {
    return this.service.removePriceListItem(priceListId, skuId);
  }

  @Post('price-lists/:id/assign/:groupId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('price-list:update')
  @ApiOperation({ summary: 'Gán bảng giá cho nhóm khách hàng' })
  assignPriceListToGroup(
    @Param('id') priceListId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.service.assignPriceListToGroup(priceListId, groupId);
  }

  // =====================================================================
  // PRICING (User-facing)
  // =====================================================================

  @Get('my-prices')
  @ApiOperation({ summary: 'Lấy bảng giá áp dụng cho tôi' })
  getMyPriceList(@GetUser('id') userId: string) {
    return this.service.getPriceListForUser(userId);
  }

  @Get('prices/:skuId')
  @ApiOperation({ summary: 'Lấy giá cho một SKU' })
  getPriceForSku(@Param('skuId') skuId: string, @GetUser('id') userId: string) {
    return this.service.getPriceForSku(skuId, userId);
  }

  @Post('prices')
  @ApiOperation({ summary: 'Lấy giá cho nhiều SKUs' })
  getPricesForSkus(
    @Body() body: { skuIds: string[] },
    @GetUser('id') userId: string,
  ) {
    return this.service.getPricesForSkus(body.skuIds, userId);
  }

  @Get('stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customer-group:read')
  @ApiOperation({ summary: 'Thống kê B2B' })
  getStats() {
    return this.service.getB2BStats();
  }
}
