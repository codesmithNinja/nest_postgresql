import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { USER_REPOSITORY } from './repositories/user/user.repository.interface';
import { UserPostgresRepository } from './repositories/user/user-postgres.repository';
import { UserMongoRepository } from './repositories/user/user-mongodb.repository';
import { User, UserDocument, UserSchema } from './schemas/user.schema';
import { ADMIN_REPOSITORY } from './repositories/admin/admin.repository.interface';
import { AdminPostgresRepository } from './repositories/admin/admin-postgres.repository';
import { AdminMongoRepository } from './repositories/admin/admin-mongodb.repository';
import { Admin, AdminDocument, AdminSchema } from './schemas/admin.schema';
import { DatabaseType } from '../common/enums/database-type.enum';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    // We need to use a factory approach to conditionally setup the module
    return {
      module: DatabaseModule,
      imports: [
        // Import ConfigModule to access config in the provider factory
      ],
      providers: [
        {
          provide: 'DATABASE_SETUP',
          useFactory: (configService: ConfigService) => {
            const dbType = configService.get<DatabaseType>('database.type');

            // Validate environment variables based on database type
            if (dbType === DatabaseType.POSTGRES) {
              const dbUrl = configService.get<string>('database.postgres.url');
              if (!dbUrl) {
                throw new Error(
                  'DATABASE_URL is required when DATABASE_TYPE=postgres'
                );
              }
            } else if (dbType === DatabaseType.MONGODB) {
              const mongoUri = configService.get<string>(
                'database.mongodb.uri'
              );
              if (!mongoUri) {
                throw new Error(
                  'MONGODB_URI is required when DATABASE_TYPE=mongodb'
                );
              }
            } else {
              throw new Error(
                `Invalid DATABASE_TYPE: ${dbType}. Must be 'postgres' or 'mongodb'`
              );
            }

            return { dbType };
          },
          inject: [ConfigService],
        },
      ],
      exports: [],
    };
  }

  static forRootConditional(): DynamicModule {
    // Use process.env directly to read DATABASE_TYPE at module initialization
    const dbType = (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;

    const imports: any[] = [];
    const providers: Provider[] = [];
    const exports: any[] = [];

    if (dbType === DatabaseType.POSTGRES) {
      // PostgreSQL setup only
      imports.push(PrismaModule);

      providers.push(
        {
          provide: USER_REPOSITORY,
          useFactory: (prismaService: PrismaService) => {
            return new UserPostgresRepository(prismaService);
          },
          inject: [PrismaService],
        },
        {
          provide: ADMIN_REPOSITORY,
          useFactory: (prismaService: PrismaService) => {
            return new AdminPostgresRepository(prismaService);
          },
          inject: [PrismaService],
        }
      );
    } else if (dbType === DatabaseType.MONGODB) {
      // MongoDB setup only
      imports.push(
        MongooseModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            uri: configService.get<string>('database.mongodb.uri'),
          }),
          inject: [ConfigService],
        }),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Admin.name, schema: AdminSchema },
        ])
      );

      providers.push(
        {
          provide: USER_REPOSITORY,
          useFactory: (userModel: Model<UserDocument>) => {
            return new UserMongoRepository(userModel);
          },
          inject: [getModelToken(User.name)],
        },
        {
          provide: ADMIN_REPOSITORY,
          useFactory: (adminModel: Model<AdminDocument>) => {
            return new AdminMongoRepository(adminModel);
          },
          inject: [getModelToken(Admin.name)],
        }
      );
    }

    exports.push(USER_REPOSITORY, ADMIN_REPOSITORY);

    return {
      module: DatabaseModule,
      imports,
      providers,
      exports,
    };
  }
}
