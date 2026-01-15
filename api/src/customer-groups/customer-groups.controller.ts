import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import { CustomerGroupsService } from './customer-groups.service';
import {
  CreateCustomerGroupDto,
  CreatePriceListDto,
} from './dto/customer-group.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('customer-groups')
@UseGuards(JwtAuthGuard)
export class CustomerGroupsController {
  constructor(private readonly service: CustomerGroupsService) {}

  @Post()
  async createGroup(@Body() dto: CreateCustomerGroupDto) {
    return this.service.createGroup(dto);
  }

  @Get()
  async findAllGroups() {
    return this.service.findAllGroups();
  }

  @Post('price-lists')
  async createPriceList(@Body() dto: CreatePriceListDto) {
    return this.service.createPriceList(dto);
  }

  @Get('my-price')
  async getMyPriceList(@Req() req) {
    // API cho client để biết mình đang được hưởng bảng giá nào
    return this.service.getPriceListForUser(req.user.id);
  }
}
