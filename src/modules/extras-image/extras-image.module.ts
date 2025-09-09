import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { ExtrasImageController } from './extras-image.controller';
import { ExtrasImageService } from './extras-image.service';
import { ExtrasImagePostgresRepository } from '../../database/repositories/extras-image/extras-image-postgres.repository';
import { ExtrasImageMongoRepository } from '../../database/repositories/extras-image/extras-image-mongodb.repository';
import {
  ExtrasImage,
  ExtrasImageSchema,
  ExtrasImageDocument,
} from '../../database/schemas/extras-image.schema';
import { EXTRAS_IMAGE_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EquityModule } from '../equity/equity.module';
import { FileManagementService } from '../../common/services/file-management.service';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: ExtrasImage.name, schema: ExtrasImageSchema },
    ]),
    EquityModule,
  ],
  controllers: [ExtrasImageController],
  providers: [
    ExtrasImageService,
    FileManagementService,
    {
      provide: EXTRAS_IMAGE_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        model: Model<ExtrasImageDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new ExtrasImageMongoRepository(model);
        }
        return new ExtrasImagePostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'ExtrasImageModel'],
    },
  ],
  exports: [ExtrasImageService, EXTRAS_IMAGE_REPOSITORY],
})
export class ExtrasImageModule {}
