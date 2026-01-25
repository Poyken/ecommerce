import { QueryUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

export interface GetProductTranslationsInput {
  productId: string;
}

export type GetProductTranslationsOutput = {
  translations: any[];
};

@Injectable()
export class GetProductTranslationsUseCase extends QueryUseCase<
  GetProductTranslationsInput,
  GetProductTranslationsOutput
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: GetProductTranslationsInput,
  ): Promise<Result<GetProductTranslationsOutput, Error>> {
    try {
      const translations = await this.prisma.productTranslation.findMany({
        where: { productId: input.productId },
      });

      return Result.ok({ translations });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
