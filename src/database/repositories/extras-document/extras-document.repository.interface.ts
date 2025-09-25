import { IRepository } from '../../../common/interfaces/repository.interface';
import { ExtrasDocument } from '../../entities/extras-document.entity';

export interface IExtrasDocumentRepository extends IRepository<ExtrasDocument> {
  findByEquityId(equityId: string): Promise<ExtrasDocument[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasDocument | null>;
}

export const EXTRAS_DOCUMENT_REPOSITORY = 'EXTRAS_DOCUMENT_REPOSITORY';
