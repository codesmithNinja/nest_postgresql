import { IRepository } from '../../../common/interfaces/repository.interface';
import { ExtrasVideo } from '../../entities/extras-video.entity';

export interface IExtrasVideoRepository extends IRepository<ExtrasVideo> {
  findByEquityId(equityId: string): Promise<ExtrasVideo[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasVideo | null>;
}

export const EXTRAS_VIDEO_REPOSITORY = 'EXTRAS_VIDEO_REPOSITORY';
