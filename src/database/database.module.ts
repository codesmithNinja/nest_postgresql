import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { DatabaseType } from '../common/enums/database-type.enum';
import { USER_REPOSITORY } from './repositories/user/user.repository.interface';
import { UserPostgresRepository } from './repositories/user/user-postgres.repository';
import { UserMongoRepository } from './repositories/user/user-mongodb.repository';
import { User, UserSchema } from './schemas/user.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<DatabaseType>('database.type');
        if (dbType === DatabaseType.MONGODB) {
          return {
            uri: configService.get<string>('database.mongodb.uri'),
          };
        }
        return {}; // Return empty config if not MongoDB
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PrismaModule,
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        userMongoRepository: UserMongoRepository
      ) => {
        const dbType = configService.get<DatabaseType>('database.type');

        if (dbType === DatabaseType.MONGODB) {
          return userMongoRepository;
        }

        return new UserPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, UserMongoRepository],
    },
    UserMongoRepository,
  ],
  exports: [USER_REPOSITORY],
})
export class DatabaseModule {}
