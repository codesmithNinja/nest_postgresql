import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
    // private emailService: EmailService
  ) {}

  async register(registerDto: RegisterDto, ipAddress: string) {
    const { email, password, firstName, lastName, ...rest } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

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
    const hashedActivationToken = crypto
      .createHash('sha256')
      .update(activationToken)
      .digest('hex');

    // Create user
    const createData: any = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      slug,
      signupIpAddress: ipAddress,
      accountActivationToken: hashedActivationToken,
    };

    // Add optional fields only if they exist
    if (rest.phoneNumber) createData.phoneNumber = rest.phoneNumber;
    if (rest.userLocation) createData.userLocation = rest.userLocation;
    if (rest.zipcode) createData.zipcode = rest.zipcode;
    if (rest.aboutYourself) createData.aboutYourself = rest.aboutYourself;
    if (rest.userTypeId) createData.userTypeId = rest.userTypeId;
    if (rest.outsideLinks)
      createData.outsideLinks = JSON.stringify(rest.outsideLinks);

    const user = await this.prisma.user.create({
      data: createData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        slug: true,
        active: true,
        createdAt: true,
      },
    });

    // Send activation email
    /* try {
      await this.emailService.sendAccountActivationEmail(
        email,
        activationToken,
        firstName
      );
    } catch (error) {
      console.error('Failed to send activation email:', error);
      // Don't throw error here, user is already created
    } */

    return {
      message:
        'Registration successful. Please check your email to activate your account.',
      user,
    };
  }

  async login(loginDto: LoginDto, ipAddress: string) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userType: true,
        notificationLanguage: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.active !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Account is not active. Please activate your account first.'
      );
    }

    // Update login IP address
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginIpAddress: ipAddress },
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: userPassword, ...userWithoutPassword } = user;

    return {
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    };
  }

  async activateAccount(activateAccountDto: ActivateAccountDto) {
    const { token } = activateAccountDto;

    // Hash the token to match with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this activation token
    const user = await this.prisma.user.findFirst({
      where: {
        accountActivationToken: hashedToken,
        active: 'PENDING',
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    // Activate user account
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        active: 'ACTIVE',
        accountActivationToken: null,
      },
    });

    return {
      message: 'Account activated successfully. You can now login.',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

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
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetExpires: resetTokenExpiry,
      },
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

    return {
      message: 'Password reset email sent successfully',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Hash the token to match with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    return {
      message: 'Password reset successfully',
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: userPassword, ...result } = user;
      return result;
    }
    return null;
  }
}
