import { IRepository } from '../../../common/interfaces/repository.interface';
import { ExtrasImage } from '../../entities/extras-image.entity';

export interface IExtrasImageRepository extends IRepository<ExtrasImage> {
  findByEquityId(equityId: string): Promise<ExtrasImage[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasImage | null>;
}

export const EXTRAS_IMAGE_REPOSITORY = 'EXTRAS_IMAGE_REPOSITORY';
