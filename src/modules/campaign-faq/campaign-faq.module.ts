import { Module, DynamicModule } from '@nestjs/common';
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

export class CampaignFaqModule {
  static register(): DynamicModule {
    const dbType =
      (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: any[] = [
      DatabaseModule.forRootConditional(),
      EquityModule.register(),
    ];
    const providers: any[] = [CampaignFaqService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([
          { name: CampaignFaq.name, schema: CampaignFaqSchema },
        ])
      );
      providers.push({
        provide: CAMPAIGN_FAQ_REPOSITORY,
        useFactory: (model: Model<CampaignFaqDocument>) => {
          return new CampaignFaqMongoRepository(model);
        },
        inject: ['CampaignFaqModel'],
      });
    } else {
      providers.push({
        provide: CAMPAIGN_FAQ_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new CampaignFaqPostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: CampaignFaqModule,
      imports,
      controllers: [CampaignFaqController],
      providers,
      exports: [CampaignFaqService, CAMPAIGN_FAQ_REPOSITORY],
    };
  }
}
