import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../database/repositories/user/user.repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
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
    private jwtService: JwtService
    // private emailService: EmailService
  ) {}

  async register(registerDto: RegisterDto, ipAddress: string) {
    const { email, password, firstName, lastName, ...rest } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
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

    // Prepare user data
    const userData: RegisterDto = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      slug,
      signupIpAddress: ipAddress,
      accountActivationToken: hashedActivationToken,
      ...rest,
    };

    // Handle outsideLinks for different databases
    if (rest.outsideLinks) {
      userData.outsideLinks = rest.outsideLinks;
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
    delete user.password;
    delete user.accountActivationToken;

    return ResponseHandler.created(
      'Registration successful. Please check your email to activate your account.',
      user
    );
  }

  async login(loginDto: LoginDto, ipAddress: string) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.active !== ActiveStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Account is not active. Please activate your account first.'
      );
    }

    // Update login IP address
    await this.userRepository.updateById(user.id, {
      loginIpAddress: ipAddress,
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    // Remove password from response
    delete user.password;

    return ResponseHandler.success('Login successful', 200, {
      user,
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
      throw new BadRequestException('Invalid or expired activation token');
    }

    // Activate user account
    await this.userRepository.activateUser(user.id);

    return ResponseHandler.success(
      'Account activated successfully. You can now login.'
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.getDetail({ email });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
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
      throw new BadRequestException('Failed to send password reset email');
    } */

    return ResponseHandler.success('Password reset email sent successfully');
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Hash the token to match with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token
    const user = await this.userRepository.findByResetToken(hashedToken);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await this.userRepository.updatePassword(user.id, hashedPassword);

    return ResponseHandler.success('Password reset successfully');
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
