import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { TEAM_MEMBER_REPOSITORY } from '../../common/interfaces/campaign-repository.interface';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EquityModule } from '../equity/equity.module';
import { FileManagementService } from '../../common/services/file-management.service';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: TeamMember.name, schema: TeamMemberSchema },
    ]),
    EquityModule,
  ],
  controllers: [TeamMemberController],
  providers: [
    TeamMemberService,
    FileManagementService,
    {
      provide: TEAM_MEMBER_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        model: Model<TeamMemberDocument>
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return new TeamMemberMongoRepository(model);
        }
        return new TeamMemberPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, 'TeamMemberModel'],
    },
  ],
  exports: [TeamMemberService, TEAM_MEMBER_REPOSITORY],
})
export class TeamMemberModule {}
