import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { EquityController } from './equity.controller';
import { EquityService } from './equity.service';
import { EquityPostgresRepository } from '../../database/repositories/equity/equity-postgres.repository';
import { EquityMongoRepository } from '../../database/repositories/equity/equity-mongodb.repository';
import {
  Equity,
  EquitySchema,
  EquityDocument,
} from '../../database/schemas/equity.schema';
import { EQUITY_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';

export class EquityModule {
  static register(): DynamicModule {
    const dbType =
      (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: any[] = [DatabaseModule.forRootConditional()];
    const providers: any[] = [EquityService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([{ name: Equity.name, schema: EquitySchema }])
      );
      providers.push({
        provide: EQUITY_REPOSITORY,
        useFactory: (equityModel: Model<EquityDocument>) => {
          return new EquityMongoRepository(equityModel);
        },
        inject: [getModelToken(Equity.name)],
      });
    } else {
      providers.push({
        provide: EQUITY_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new EquityPostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: EquityModule,
      imports,
      controllers: [EquityController],
      providers,
      exports: [EquityService, EQUITY_REPOSITORY],
    };
  }
}
