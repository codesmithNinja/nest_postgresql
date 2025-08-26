import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { USER_REPOSITORY } from './repositories/user/user.repository.interface';
import { UserPostgresRepository } from './repositories/user/user-postgres.repository';
import { UserMongoRepository } from './repositories/user/user-mongodb.repository';
import { User, UserDocument, UserSchema } from './schemas/user.schema';
import { DatabaseType } from '../common/enums/database-type.enum';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        PrismaModule,
        MongooseModule.forRootAsync({
          useFactory: (configService: ConfigService) => {
            const dbType = configService.get<DatabaseType>('database.type');
            return dbType === DatabaseType.MONGODB
              ? { uri: configService.get<string>('database.mongodb.uri') }
              : { uri: 'mongodb://localhost:27017/dummy' };
          },
          inject: [ConfigService],
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [
        {
          provide: USER_REPOSITORY,
          useFactory: (
            configService: ConfigService,
            prismaService: PrismaService,
            userModel: Model<UserDocument>
          ) => {
            const dbType = configService.get<DatabaseType>('database.type');
            if (dbType === DatabaseType.MONGODB) {
              return new UserMongoRepository(userModel);
            }
            return new UserPostgresRepository(prismaService);
          },
          inject: [ConfigService, PrismaService, getModelToken(User.name)],
        },
      ],
      exports: [USER_REPOSITORY],
    };
  }
}
