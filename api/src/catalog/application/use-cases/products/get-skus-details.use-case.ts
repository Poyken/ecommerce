import { QueryUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

export interface GetSkusDetailsInput {
  skuIds: string[];
}

export type GetSkusDetailsOutput = {
  skus: any[];
};

@Injectable()
export class GetSkusDetailsUseCase extends QueryUseCase<
  GetSkusDetailsInput,
  GetSkusDetailsOutput
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: GetSkusDetailsInput,
  ): Promise<Result<GetSkusDetailsOutput, Error>> {
    const validIds = input.skuIds.filter((id) => id);
    if (validIds.length === 0) {
      return Result.ok({ skus: [] });
    }

    try {
      const skus = await this.prisma.sku.findMany({
        where: {
          id: { in: validIds },
        },
        select: {
          id: true,
          skuCode: true,
          price: true,
          salePrice: true,
          stock: true,
          imageUrl: true,
          status: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              brandId: true,
              images: {
                select: { url: true, alt: true },
                orderBy: { displayOrder: 'asc' },
                take: 1,
              },
              categories: {
                select: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
              brand: {
                select: { id: true, name: true },
              },
            },
          },
          optionValues: {
            select: {
              optionValue: {
                select: {
                  id: true,
                  value: true,
                  imageUrl: true,
                  option: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      });

      return Result.ok({ skus });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
