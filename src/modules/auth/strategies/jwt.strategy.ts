import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../database/repositories/user/user.repository.interface';
import { ActiveStatus } from '../../../common/enums/database-type.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository
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

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userRepository.findById(payload.sub);

    if (!user || user.active !== ActiveStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Remove sensitive data before returning
    const {
      password,
      accountActivationToken,
      passwordResetToken,
      twoFactorSecretKey,
      ...userWithoutSensitiveData
    } = user as any;

    return userWithoutSensitiveData;
  }
}
