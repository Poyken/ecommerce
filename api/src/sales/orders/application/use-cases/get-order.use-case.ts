import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';

export interface GetOrderInput {
  id: string;
  userId?: string;
}

export type GetOrderOutput = {
  order: any;
};

@Injectable()
export class GetOrderUseCase extends QueryUseCase<
  GetOrderInput,
  GetOrderOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {
    super();
  }

  async execute(input: GetOrderInput): Promise<Result<GetOrderOutput>> {
    try {
      const order = await this.orderRepository.findById(input.id);

      if (!order) {
        return Result.fail(
          new NotFoundException(`Không tìm thấy đơn hàng #${input.id}`),
        );
      }

      if (input.userId && order.userId !== input.userId) {
        return Result.fail(
          new ForbiddenException('Bạn không có quyền xem đơn hàng này'),
        );
      }

      return Result.ok({
        order: order.toPersistence(),
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
