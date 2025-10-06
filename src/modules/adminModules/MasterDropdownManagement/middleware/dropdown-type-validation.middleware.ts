import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LanguageDetectionService } from '../utils/language-detection.service';

interface RequestWithDropdownType extends Request {
  validatedDropdownType?: string;
  originalDropdownType?: string;
}

@Injectable()
export class DropdownTypeValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DropdownTypeValidationMiddleware.name);

  constructor(
    private readonly languageDetectionService: LanguageDetectionService
  ) {}

  use(req: RequestWithDropdownType, res: Response, next: NextFunction): void {
    try {
      // Extract dropdown type from route parameters
      const optionType = req.params.optionType;

      if (!optionType) {
        // This middleware should only be applied to routes with optionType parameter
        next();
        return;
      }

      // Store original dropdown type
      req.originalDropdownType = optionType;

      // Validate dropdown type
      if (!this.languageDetectionService.validateDropdownType(optionType)) {
        throw new BadRequestException(
          `Invalid dropdown type '${optionType}'. Dropdown type must be 2-50 characters long, start with a letter, and contain only lowercase letters, numbers, hyphens, and underscores.`
        );
      }

      // Normalize dropdown type
      const normalizedDropdownType =
        this.languageDetectionService.normalizeDropdownType(optionType);
      req.validatedDropdownType = normalizedDropdownType;

      // Update the params to use normalized type (optional)
      req.params.optionType = normalizedDropdownType;

      // Log validation for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Dropdown type validated: ${optionType} -> ${normalizedDropdownType}`
        );
      }

      next();
    } catch (error) {
      this.logger.warn('Error in dropdown type validation middleware:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid dropdown type format');
    }
  }
}

// Helper decorator for applying the middleware to specific routes
export function ValidateDropdownType() {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    // This is a decorator that can be used to mark methods that need dropdown type validation
    // The actual middleware should be applied at the module level
    Reflect.defineMetadata(
      'validate-dropdown-type',
      true,
      target,
      propertyName
    );
  };
}
