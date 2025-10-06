import { DynamicModule, Provider, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { ExtrasDocumentController } from './extras-document.controller';
import { ExtrasDocumentService } from './extras-document.service';
import { ExtrasDocumentPostgresRepository } from '../../database/repositories/extras-document/extras-document-postgres.repository';
import { ExtrasDocumentMongoRepository } from '../../database/repositories/extras-document/extras-document-mongodb.repository';
import {
  ExtrasDocument,
  ExtrasDocumentSchema,
  ExtrasDocumentDocument,
} from '../../database/schemas/extras-document.schema';
import { EXTRAS_DOCUMENT_REPOSITORY } from '../../database/repositories/extras-document/extras-document.repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EquityModule } from '../equity/equity.module';

export class ExtrasDocumentModule {
  static register(): DynamicModule {
    const dbType =
      (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: Array<Type<unknown> | DynamicModule> = [
      DatabaseModule.forRootConditional(),
      EquityModule.register(),
    ];
    const providers: Provider[] = [ExtrasDocumentService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([
          { name: ExtrasDocument.name, schema: ExtrasDocumentSchema },
        ])
      );
      providers.push({
        provide: EXTRAS_DOCUMENT_REPOSITORY,
        useFactory: (model: Model<ExtrasDocumentDocument>) => {
          return new ExtrasDocumentMongoRepository(model);
        },
        inject: ['ExtrasDocumentModel'],
      });
    } else {
      providers.push({
        provide: EXTRAS_DOCUMENT_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new ExtrasDocumentPostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: ExtrasDocumentModule,
      imports,
      controllers: [ExtrasDocumentController],
      providers,
      exports: [ExtrasDocumentService, EXTRAS_DOCUMENT_REPOSITORY],
    };
  }
}
