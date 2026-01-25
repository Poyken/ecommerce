import { CommandUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

export interface TranslateProductInput {
  productId: string;
  locale: string;
  name: string;
  description?: string;
}

export type TranslateProductOutput = {
  translation: any;
};

@Injectable()
export class TranslateProductUseCase extends CommandUseCase<
  TranslateProductInput,
  TranslateProductOutput
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: TranslateProductInput,
  ): Promise<Result<TranslateProductOutput, Error>> {
    const { productId, locale, name, description } = input;

    try {
      const translation = await this.prisma.productTranslation.upsert({
        where: {
          productId_locale: {
            productId,
            locale,
          },
        },
        update: {
          name,
          description,
        },
        create: {
          productId,
          locale,
          name,
          description,
        },
      });

      return Result.ok({ translation });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
