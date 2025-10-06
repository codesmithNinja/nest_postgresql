import { HttpException, HttpStatus } from '@nestjs/common';

export class LanguageAlreadyExistsException extends HttpException {
  constructor(field: string, value: string) {
    super(
      {
        message: `Language with ${field} '${value}' already exists`,
        error: 'Language Already Exists',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class LanguageNotFoundException extends HttpException {
  constructor(identifier: string) {
    super(
      {
        message: `Language with identifier '${identifier}' not found`,
        error: 'Language Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class LanguageIsoCodeConflictException extends HttpException {
  constructor(code: string, type: 'ISO2' | 'ISO3') {
    super(
      {
        message: `Language with ${type} code '${code}' already exists`,
        error: 'Language ISO Code Conflict',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class InvalidLanguageDataException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `Invalid language data: ${message}`,
        error: 'Invalid Language Data',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class DefaultLanguageDeletionException extends HttpException {
  constructor(languageName: string) {
    super(
      {
        message: `Cannot delete default language '${languageName}'. Please set another language as default first.`,
        error: 'Default Language Deletion Not Allowed',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class LanguageFolderConflictException extends HttpException {
  constructor(folder: string) {
    super(
      {
        message: `Language with folder name '${folder}' already exists`,
        error: 'Language Folder Conflict',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}
