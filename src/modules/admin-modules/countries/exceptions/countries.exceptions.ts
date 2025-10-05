import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class CountryAlreadyExistsException extends ConflictException {
  constructor(field: string, value: string) {
    super(`Country with ${field} '${value}' already exists`);
  }
}

export class CountryNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Country with identifier '${identifier}' not found`);
  }
}

export class CountryInUseException extends BadRequestException {
  constructor(countryName: string, useCount: number) {
    super(
      `Cannot delete country '${countryName}' as it is currently being used in ${useCount} place(s). Set useCount to 0 before deletion.`
    );
  }
}

export class InvalidCountryDataException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class CountryIsoCodeConflictException extends ConflictException {
  constructor(isoCode: string, type: 'ISO2' | 'ISO3') {
    super(`Country with ${type} code '${isoCode}' already exists`);
  }
}

export class DefaultCountryException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class CountryFileUploadException extends BadRequestException {
  constructor(message: string) {
    super(`Country flag upload error: ${message}`);
  }
}
