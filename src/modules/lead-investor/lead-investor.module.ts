import { DynamicModule, Provider, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { LeadInvestorController } from './lead-investor.controller';
import { LeadInvestorService } from './lead-investor.service';
import { LeadInvestorPostgresRepository } from '../../database/repositories/lead-investor/lead-investor-postgres.repository';
import { LeadInvestorMongoRepository } from '../../database/repositories/lead-investor/lead-investor-mongodb.repository';
import {
  LeadInvestor,
  LeadInvestorSchema,
  LeadInvestorDocument,
} from '../../database/schemas/lead-investor.schema';
import { LEAD_INVESTOR_REPOSITORY } from '../../database/repositories/lead-investor/lead-investor.repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FileManagementService } from '../../common/services/file-management.service';
import { EquityModule } from '../equity/equity.module';

export class LeadInvestorModule {
  static register(): DynamicModule {
    const dbType =
      (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: Array<Type<unknown> | DynamicModule> = [
      DatabaseModule.forRootConditional(),
      EquityModule.register(),
    ];
    const providers: Provider[] = [LeadInvestorService, FileManagementService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([
          { name: LeadInvestor.name, schema: LeadInvestorSchema },
        ])
      );
      providers.push({
        provide: LEAD_INVESTOR_REPOSITORY,
        useFactory: (model: Model<LeadInvestorDocument>) => {
          return new LeadInvestorMongoRepository(model);
        },
        inject: ['LeadInvestorModel'],
      });
    } else {
      providers.push({
        provide: LEAD_INVESTOR_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new LeadInvestorPostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: LeadInvestorModule,
      imports,
      controllers: [LeadInvestorController],
      providers,
      exports: [LeadInvestorService, LEAD_INVESTOR_REPOSITORY],
    };
  }
}
