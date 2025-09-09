import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';

@Module({})
export class MongoDBModule {
  static forRoot(): DynamicModule {
    const imports: DynamicModule[] = [];
    const providers: Provider[] = [];

    const mongooseRootModule = MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService): MongooseModuleOptions => ({
        uri:
          configService.get<string>('database.mongodb.uri') ||
          'mongodb://localhost:27017/defaultdb',
      }),
      inject: [ConfigService],
    });

    const mongooseFeatureModule = MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]);

    imports.push(mongooseRootModule, mongooseFeatureModule);

    return {
      module: MongoDBModule,
      imports,
      providers,
      exports: [mongooseFeatureModule],
    };
  }
}
