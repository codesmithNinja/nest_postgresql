import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  IAdminRepository,
  ADMIN_REPOSITORY,
} from '../../../../database/repositories/admin/admin.repository.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private configService: ConfigService,
    @Inject(ADMIN_REPOSITORY) private adminRepository: IAdminRepository
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    type: string;
  }): Promise<Record<string, unknown>> {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.adminRepository.findById(payload.sub);

    if (!admin || !admin.active) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      password: _password,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      passwordResetToken: _passwordResetToken,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      twoFactorSecretKey: _twoFactorSecretKey,
      ...adminWithoutSensitiveData
    } = admin;

    return adminWithoutSensitiveData as Record<string, unknown>;
  }
}
