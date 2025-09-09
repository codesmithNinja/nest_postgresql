import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { CampaignFaqController } from './campaign-faq.controller';
import { CampaignFaqService } from './campaign-faq.service';
import { CampaignFaqPostgresRepository } from '../../database/repositories/campaign-faq/campaign-faq-postgres.repository';
import { CampaignFaqMongoRepository } from '../../database/repositories/campaign-faq/campaign-faq-mongodb.repository';
import {
  CampaignFaq,
  CampaignFaqSchema,
  CampaignFaqDocument,
} from '../../database/schemas/campaign-faq.schema';
import { CAMPAIGN_FAQ_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EquityModule } from '../equity/equity.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: CampaignFaq.name, schema: CampaignFaqSchema },
    ]),
    EquityModule,
  ],
  controllers: [CampaignFaqController],
  providers: [
    CampaignFaqService,
    {
      provide: CAMPAIGN_FAQ_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        model: Model<CampaignFaqDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new CampaignFaqMongoRepository(model);
        }
        return new CampaignFaqPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'CampaignFaqModel'],
    },
  ],
  exports: [CampaignFaqService, CAMPAIGN_FAQ_REPOSITORY],
})
export class CampaignFaqModule {}
