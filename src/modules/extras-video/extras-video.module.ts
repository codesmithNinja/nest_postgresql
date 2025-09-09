import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: ExtrasVideo.name, schema: ExtrasVideoSchema },
    ]),
    EquityModule,
  ],
  controllers: [ExtrasVideoController],
  providers: [
    ExtrasVideoService,
    {
      provide: EXTRAS_VIDEO_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        model: Model<ExtrasVideoDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new ExtrasVideoMongoRepository(model);
        }
        return new ExtrasVideoPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'ExtrasVideoModel'],
    },
  ],
  exports: [ExtrasVideoService, EXTRAS_VIDEO_REPOSITORY],
})
export class ExtrasVideoModule {}
