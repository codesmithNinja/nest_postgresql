import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../database/repositories/user/user.repository.interface';
import { I18nResponseService } from '../../common/services/i18n-response.service';
// import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import slugify from 'slugify';
import {
  RegisterDto,
  LoginDto,
  ActivateAccountDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { ActiveStatus } from '../../common/enums/database-type.enum';
import { ValidatedUser } from './interfaces/validated-user.interface';
import { DiscardUnderscores } from '../../common/utils/discard-underscores.util';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private jwtService: JwtService,
    private i18nResponse: I18nResponseService
    // private emailService: EmailService
  ) {}

  async register(registerDto: RegisterDto, ipAddress: string) {
    const { email, password, firstName, lastName, ...rest } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return this.i18nResponse.badRequest('auth.email_already_exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate slug
    const fullName = `${firstName} ${lastName}`;
    const timeString = new Date().getTime().toString().substr(7, 5);
    const slug = `${slugify(fullName, { lower: true })}-${timeString}`;

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    console.log(activationToken);
    const hashedActivationToken = crypto
      .createHash('sha256')
      .update(activationToken)
      .digest('hex');

    const publicId = uuidv4();
    // Prepare user data - ensure userTypeId is not included if null
    const baseUserData = {
      publicId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      slug,
      signupIpAddress: ipAddress,
      accountActivationToken: hashedActivationToken,
      active: ActiveStatus.PENDING, // Explicitly set the status
    };

    // Only add userTypeId if it's provided and not null/undefined
    const userData = rest.userTypeId
      ? { ...baseUserData, ...rest }
      : { ...baseUserData, ...rest, userTypeId: undefined };

    // Remove undefined userTypeId to avoid constraint issues
    if (!userData.userTypeId) {
      delete userData.userTypeId;
    }

    const user = await this.userRepository.insert(userData);

    // Send activation email
    /* try {
      await this.emailService.sendAccountActivationEmail(
        email,
        activationToken,
        firstName
      );
    } catch (error) {
      console.error('Failed to send activation email:', error);
    } */

    // Remove sensitive data from response
    const { password: _p, accountActivationToken: _t, ...userResponse } = user;
    DiscardUnderscores(_p);
    DiscardUnderscores(_t);

    return this.i18nResponse.created(
      'auth.register_success_check_email',
      userResponse
    );
  }

  async login(loginDto: LoginDto, ipAddress: string) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    // Check if account is active
    if (user.active !== ActiveStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    // Update login IP address
    await this.userRepository.updateById(user.id, {
      loginIpAddress: ipAddress,
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _p, ...userResponse } = user;
    DiscardUnderscores(_p);

    return this.i18nResponse.success('auth.login_success', {
      user: userResponse,
      token,
    });
  }

  async activateAccount(activateAccountDto: ActivateAccountDto) {
    const { token } = activateAccountDto;

    // Hash the token to match with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this activation token
    const user = await this.userRepository.findByActivationToken(hashedToken);

    if (!user) {
      return this.i18nResponse.badRequest('auth.invalid_activation_token');
    }

    // Activate user account
    await this.userRepository.activateUser(user.id);

    return this.i18nResponse.success('auth.account_activated_login');
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.getDetail({ email });
    if (!user) {
      throw new NotFoundException();
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (10 minutes)
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with reset token
    await this.userRepository.updateById(user.id, {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: resetTokenExpiry,
    });

    // Send reset email
    /* try {
      await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.firstName
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return this.i18nResponse.badRequest('auth.password_reset_email_failed');
    } */

    return this.i18nResponse.success('auth.password_reset_email_sent');
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Hash the token to match with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token
    const user = await this.userRepository.findByResetToken(hashedToken);
    if (!user) {
      return this.i18nResponse.badRequest('auth.invalid_reset_token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await this.userRepository.updatePassword(user.id, hashedPassword);

    return this.i18nResponse.success('auth.password_reset_success');
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<ValidatedUser | null> {
    const user = await this.userRepository.getDetail({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _p, ...result } = user;
      DiscardUnderscores(_p);
      return result;
    }
    return null;
  }
}
