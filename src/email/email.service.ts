import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USERNAME'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendAccountActivationEmail(
    email: string,
    token: string,
    firstName: string
  ) {
    const activationUrl = `${this.configService.get('API_URL')}/auth/activate?token=${token}`;

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject: 'Account Activation - ' + this.configService.get('APP_NAME'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome ${firstName}!</h2>
          <p>Thank you for registering with ${this.configService.get('APP_NAME')}.</p>
          <p>Please click the button below to activate your account:</p>
          <a href="${activationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Activate Account
          </a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${activationUrl}</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string
  ) {
    const resetUrl = `${this.configService.get('API_URL')}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject: 'Password Reset - ' + this.configService.get('APP_NAME'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You requested a password reset for your account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
