import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([{ name: Equity.name, schema: EquitySchema }]),
  ],
  controllers: [EquityController],
  providers: [
    EquityService,
    {
      provide: EQUITY_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        equityModel: Model<EquityDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new EquityMongoRepository(equityModel);
        }
        return new EquityPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'EquityModel'],
    },
    {
      provide: 'EquityModel',
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          // This will be injected by MongooseModule
          return null;
        }
        return null;
      },
      inject: [ConfigService],
    },
  ],
  exports: [EquityService, EQUITY_REPOSITORY],
})
export class EquityModule {}
