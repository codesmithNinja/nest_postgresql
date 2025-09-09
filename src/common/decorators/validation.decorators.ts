import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsOptional,
} from 'class-validator';
import {
  UpdateFundraisingDetailsDto,
  UpdateInvestmentInfoDto,
} from '../../modules/equity/dto/equity.dto';
import { DateUtil } from '../utils/date.util';
import { TermSlug } from '../../database/entities/equity.entity';

export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTimezone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && DateUtil.isValidTimezone(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid timezone`;
        },
      },
    });
  };
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value) return true; // Allow optional dates
          const date = new Date(value as string | number | Date);
          return DateUtil.isFutureDate(date);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a future date`;
        },
      },
    });
  };
}

export function IsTermFieldsValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTermFieldsValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const dto = args.object as Record<string, unknown>;
          const termslug = dto.termslug as TermSlug;

          if (!termslug) return false;

          switch (termslug) {
            case TermSlug.EQUITY_DIVIDEND:
              return !!(
                dto.availableShares &&
                dto.pricePerShare &&
                dto.preMoneyValuation &&
                dto.maturityDate &&
                dto.investFrequency &&
                dto.IRR
              );
            case TermSlug.EQUITY:
              return !!(
                dto.availableShares &&
                dto.pricePerShare &&
                dto.equityAvailable &&
                dto.preMoneyValuation
              );
            case TermSlug.DEBT:
              return !!(
                dto.interestRate &&
                dto.maturityDate &&
                dto.investFrequency &&
                dto.termLength &&
                dto.preMoneyValuation
              );
            default:
              return false;
          }
        },
        defaultMessage() {
          return 'Required fields for selected term type are missing';
        },
      },
    });
  };
}

export function IsAccountNumbersMatch(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAccountNumbersMatch',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const dto = args.object as Record<string, unknown>;
          if (!dto.accountNumber || !dto.confirmAccountNumber) return true;
          return dto.accountNumber === dto.confirmAccountNumber;
        },
        defaultMessage() {
          return 'Account number and confirmation must match';
        },
      },
    });
  };
}

// Enhanced DTOs with custom validation
export class EnhancedUpdateFundraisingDetailsDto extends UpdateFundraisingDetailsDto {
  @IsOptional()
  @IsValidTimezone({ message: 'Invalid timezone format' })
  projectTimezone?: string;

  @IsOptional()
  @IsFutureDate({ message: 'Start date must be in the future' })
  startDate?: string;

  @IsFutureDate({ message: 'Closing date must be in the future' })
  closingDate: string;

  @IsTermFieldsValid({ message: 'Required fields for term type are missing' })
  termslug: TermSlug;
}

export class EnhancedUpdateInvestmentInfoDto extends UpdateInvestmentInfoDto {
  @IsOptional()
  @IsAccountNumbersMatch({ message: 'Account numbers must match' })
  confirmAccountNumber?: string;
}
