import {
  HttpStatus,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

export class AdminNotFoundException extends NotFoundException {
  constructor(message: string = 'Admin not found') {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: 'Admin Not Found',
      timestamp: new Date().toISOString(),
    });
  }
}

export class AdminAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super({
      statusCode: HttpStatus.CONFLICT,
      message: `Admin with email '${email}' already exists`,
      error: 'Admin Already Exists',
      timestamp: new Date().toISOString(),
      email,
    });
  }
}

export class InvalidAdminCredentialsException extends UnauthorizedException {
  constructor(message: string = 'Invalid admin credentials') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'Invalid Admin Credentials',
      timestamp: new Date().toISOString(),
    });
  }
}

export class InactiveAdminException extends UnauthorizedException {
  constructor(message: string = 'Admin account is inactive') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'Inactive Admin Account',
      timestamp: new Date().toISOString(),
    });
  }
}

export class AdminPasswordMismatchException extends BadRequestException {
  constructor(message: string = 'Passwords do not match') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Password Mismatch',
      timestamp: new Date().toISOString(),
    });
  }
}

export class InvalidCurrentPasswordException extends BadRequestException {
  constructor(message: string = 'Current password is incorrect') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Invalid Current Password',
      timestamp: new Date().toISOString(),
    });
  }
}

export class InvalidResetTokenException extends BadRequestException {
  constructor(message: string = 'Invalid or expired reset token') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Invalid Reset Token',
      timestamp: new Date().toISOString(),
    });
  }
}

export class AdminPermissionDeniedException extends ForbiddenException {
  constructor(message: string = 'Insufficient admin permissions') {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message,
      error: 'Admin Permission Denied',
      timestamp: new Date().toISOString(),
    });
  }
}

export class AdminFileUploadException extends BadRequestException {
  constructor(message: string = 'Admin file upload failed') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Admin File Upload Error',
      timestamp: new Date().toISOString(),
    });
  }
}

export class AdminEmailSendException extends BadRequestException {
  constructor(message: string = 'Failed to send admin email') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Admin Email Send Error',
      timestamp: new Date().toISOString(),
    });
  }
}
