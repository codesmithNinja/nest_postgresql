import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseType } from '../../common/enums/database-type.enum';
import { User, UserSchema } from '../schemas/user.schema';

@Module({})
export class MongoDBModule {
  static forRoot(): DynamicModule {
    const imports = [];
    const providers = [];

    imports.push(
      MongooseModule.forRootAsync({
        useFactory: (configService: ConfigService) => ({
          uri: configService.get<string>('database.mongodb.uri'),
        }),
        inject: [ConfigService],
      }),
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
    );

    return {
      module: MongoDBModule,
      imports,
      providers,
      exports: [...imports],
    };
  }
}
