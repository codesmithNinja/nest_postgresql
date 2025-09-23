import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { ExtrasVideoController } from './extras-video.controller';
import { ExtrasVideoService } from './extras-video.service';
import { ExtrasVideoPostgresRepository } from '../../database/repositories/extras-video/extras-video-postgres.repository';
import { ExtrasVideoMongoRepository } from '../../database/repositories/extras-video/extras-video-mongodb.repository';
import {
  ExtrasVideo,
  ExtrasVideoSchema,
  ExtrasVideoDocument,
} from '../../database/schemas/extras-video.schema';
import { EXTRAS_VIDEO_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EquityModule } from '../equity/equity.module';

export class ExtrasVideoModule {
  static register(): DynamicModule {
    const dbType = (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: any[] = [DatabaseModule.forRootConditional(), EquityModule.register()];
    const providers: any[] = [ExtrasVideoService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([
          { name: ExtrasVideo.name, schema: ExtrasVideoSchema },
        ])
      );
      providers.push({
        provide: EXTRAS_VIDEO_REPOSITORY,
        useFactory: (model: Model<ExtrasVideoDocument>) => {
          return new ExtrasVideoMongoRepository(model);
        },
        inject: ['ExtrasVideoModel'],
      });
    } else {
      providers.push({
        provide: EXTRAS_VIDEO_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new ExtrasVideoPostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: ExtrasVideoModule,
      imports,
      controllers: [ExtrasVideoController],
      providers,
      exports: [ExtrasVideoService, EXTRAS_VIDEO_REPOSITORY],
    };
  }
}
