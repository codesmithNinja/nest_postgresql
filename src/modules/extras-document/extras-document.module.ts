import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { EXTRAS_DOCUMENT_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EquityModule } from '../equity/equity.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: ExtrasDocument.name, schema: ExtrasDocumentSchema },
    ]),
    EquityModule,
  ],
  controllers: [ExtrasDocumentController],
  providers: [
    ExtrasDocumentService,
    {
      provide: EXTRAS_DOCUMENT_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        model: Model<ExtrasDocumentDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new ExtrasDocumentMongoRepository(model);
        }
        return new ExtrasDocumentPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'ExtrasDocumentModel'],
    },
  ],
  exports: [ExtrasDocumentService, EXTRAS_DOCUMENT_REPOSITORY],
})
export class ExtrasDocumentModule {}
