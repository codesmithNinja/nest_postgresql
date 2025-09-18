import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { EmailModule } from '../../../email/email.module';
import { DatabaseModule } from '../../../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn || '7d',
          },
        };
      },
      inject: [ConfigService],
    }),
    MulterModule.register({
      dest: './uploads/admins',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
    EmailModule,
  ],
  providers: [AdminUsersService, AdminJwtStrategy],
  controllers: [AdminUsersController],
  exports: [AdminUsersService, AdminJwtStrategy, PassportModule, JwtModule],
})
export class AdminUsersModule {}
