import { DynamicModule, Provider, Type } from '@nestjs/common';
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
import { EXTRAS_IMAGE_REPOSITORY } from '../../database/repositories/extras-image/extras-image.repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FileManagementService } from '../../common/services/file-management.service';
import { EquityModule } from '../equity/equity.module';

export class ExtrasImageModule {
  static register(): DynamicModule {
    const dbType =
      (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: Array<Type<unknown> | DynamicModule> = [
      DatabaseModule.forRootConditional(),
      EquityModule.register(),
    ];
    const providers: Provider[] = [ExtrasImageService, FileManagementService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([
          { name: ExtrasImage.name, schema: ExtrasImageSchema },
        ])
      );
      providers.push({
        provide: EXTRAS_IMAGE_REPOSITORY,
        useFactory: (model: Model<ExtrasImageDocument>) => {
          return new ExtrasImageMongoRepository(model);
        },
        inject: ['ExtrasImageModel'],
      });
    } else {
      providers.push({
        provide: EXTRAS_IMAGE_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new ExtrasImagePostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: ExtrasImageModule,
      imports,
      controllers: [ExtrasImageController],
      providers,
      exports: [ExtrasImageService, EXTRAS_IMAGE_REPOSITORY],
    };
  }
}
