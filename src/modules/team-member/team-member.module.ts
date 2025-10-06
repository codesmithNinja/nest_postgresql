import { DynamicModule, Provider, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModule } from '../../database/database.module';
import { TeamMemberController } from './team-member.controller';
import { TeamMemberService } from './team-member.service';
import { TeamMemberPostgresRepository } from '../../database/repositories/team-member/team-member-postgres.repository';
import { TeamMemberMongoRepository } from '../../database/repositories/team-member/team-member-mongodb.repository';
import {
  TeamMember,
  TeamMemberSchema,
  TeamMemberDocument,
} from '../../database/schemas/team-member.schema';
import { TEAM_MEMBER_REPOSITORY } from '../../database/repositories/team-member/team-member.repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FileManagementService } from '../../common/services/file-management.service';
import { EquityModule } from '../equity/equity.module';

export class TeamMemberModule {
  static register(): DynamicModule {
    const dbType =
      (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;
    const imports: Array<Type<unknown> | DynamicModule> = [
      DatabaseModule.forRootConditional(),
      EquityModule.register(),
    ];
    const providers: Provider[] = [TeamMemberService, FileManagementService];

    if (dbType === DatabaseType.MONGODB) {
      imports.push(
        MongooseModule.forFeature([
          { name: TeamMember.name, schema: TeamMemberSchema },
        ])
      );
      providers.push({
        provide: TEAM_MEMBER_REPOSITORY,
        useFactory: (model: Model<TeamMemberDocument>) => {
          return new TeamMemberMongoRepository(model);
        },
        inject: ['TeamMemberModel'],
      });
    } else {
      providers.push({
        provide: TEAM_MEMBER_REPOSITORY,
        useFactory: (prismaService: PrismaService) => {
          return new TeamMemberPostgresRepository(prismaService);
        },
        inject: [PrismaService],
      });
    }

    return {
      module: TeamMemberModule,
      imports,
      controllers: [TeamMemberController],
      providers,
      exports: [TeamMemberService, TEAM_MEMBER_REPOSITORY],
    };
  }
}
