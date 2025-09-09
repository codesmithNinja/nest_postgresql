import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { IExtrasDocumentRepository } from '../../../common/interfaces/campaign-repository.interface';
import { ExtrasDocument } from '../../entities/extras-document.entity';

@Injectable()
export class ExtrasDocumentPostgresRepository
  extends PostgresRepository<ExtrasDocument>
  implements IExtrasDocumentRepository
{
  protected modelName = 'extrasDocument';
  protected selectFields = {
    id: true,
    publicId: true,
    documentUrl: true,
    documentTitle: true,
    equityId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEquityId(equityId: string): Promise<ExtrasDocument[]> {
    const results = await this.prisma.extrasDocument.findMany({
      where: { equityId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' },
    });
    return results as ExtrasDocument[];
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasDocument | null> {
    const result = await this.prisma.extrasDocument.findFirst({
      where: { equityId, publicId },
      select: this.selectFields,
    });
    return result as ExtrasDocument | null;
  }
}
