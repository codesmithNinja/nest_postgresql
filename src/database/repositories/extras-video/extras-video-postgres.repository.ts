import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { IExtrasVideoRepository } from '../../../common/interfaces/campaign-repository.interface';
import { ExtrasVideo } from '../../entities/extras-video.entity';

@Injectable()
export class ExtrasVideoPostgresRepository
  extends PostgresRepository<ExtrasVideo>
  implements IExtrasVideoRepository
{
  protected modelName = 'extrasVideo';
  protected selectFields = {
    id: true,
    publicId: true,
    videoUrl: true,
    videoTitle: true,
    videoDescription: true,
    equityId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEquityId(equityId: string): Promise<ExtrasVideo[]> {
    const results = await this.prisma.extrasVideo.findMany({
      where: { equityId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' },
    });
    return results as ExtrasVideo[];
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasVideo | null> {
    const result = await this.prisma.extrasVideo.findFirst({
      where: { equityId, publicId },
      select: this.selectFields,
    });
    return result as ExtrasVideo | null;
  }
}
