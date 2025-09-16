import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { EquityModule } from '../equity/equity.module';
import { LeadInvestorController } from './lead-investor.controller';
import { LeadInvestorService } from './lead-investor.service';
import { LeadInvestorPostgresRepository } from '../../database/repositories/lead-investor/lead-investor-postgres.repository';
import { LeadInvestorMongoRepository } from '../../database/repositories/lead-investor/lead-investor-mongodb.repository';
import {
  LeadInvestor,
  LeadInvestorSchema,
  LeadInvestorDocument,
} from '../../database/schemas/lead-investor.schema';
import { LEAD_INVESTOR_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FileManagementService } from '../../common/services/file-management.service';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: LeadInvestor.name, schema: LeadInvestorSchema },
    ]),
    EquityModule,
  ],
  controllers: [LeadInvestorController],
  providers: [
    LeadInvestorService,
    FileManagementService,
    {
      provide: LEAD_INVESTOR_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        model: Model<LeadInvestorDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new LeadInvestorMongoRepository(model);
        }
        return new LeadInvestorPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'LeadInvestorModel'],
    },
  ],
  exports: [LeadInvestorService, LEAD_INVESTOR_REPOSITORY],
})
export class LeadInvestorModule {}
