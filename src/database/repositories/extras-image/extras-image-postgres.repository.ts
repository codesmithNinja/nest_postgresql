import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { IExtrasImageRepository } from '../../../common/interfaces/campaign-repository.interface';
import { ExtrasImage } from '../../entities/extras-image.entity';

@Injectable()
export class ExtrasImagePostgresRepository
  extends PostgresRepository<ExtrasImage>
  implements IExtrasImageRepository
{
  protected modelName = 'extrasImage';
  protected selectFields = {
    id: true,
    publicId: true,
    imageUrl: true,
    imageTitle: true,
    imageDescription: true,
    equityId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEquityId(equityId: string): Promise<ExtrasImage[]> {
    const results = await this.prisma.extrasImage.findMany({
      where: { equityId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' },
    });
    return results as ExtrasImage[];
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasImage | null> {
    const result = await this.prisma.extrasImage.findFirst({
      where: { equityId, publicId },
      select: this.selectFields,
    });
    return result as ExtrasImage | null;
  }
}
