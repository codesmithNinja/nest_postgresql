import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InvalidGroupTypeException } from '../exceptions/settings.exceptions';

@Injectable()
export class GroupTypeValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GroupTypeValidationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { groupType } = req.params;

    this.logger.debug(`Validating group type: ${groupType}`);

    if (!groupType) {
      this.logger.warn('Group type parameter is missing');
      throw new InvalidGroupTypeException('Missing group type parameter');
    }

    if (!this.isValidGroupType(groupType)) {
      this.logger.warn(`Invalid group type format: ${groupType}`);
      throw new InvalidGroupTypeException(groupType);
    }

    // Sanitize the group type by trimming and converting to lowercase
    req.params.groupType = groupType.trim().toLowerCase();

    this.logger.debug(`Group type validation passed: ${req.params.groupType}`);
    next();
  }

  private isValidGroupType(groupType: string): boolean {
    // Check if group type is a non-empty string
    if (!groupType || typeof groupType !== 'string') {
      return false;
    }

    // Check length constraints
    if (groupType.length < 1 || groupType.length > 100) {
      return false;
    }

    // Check if it contains only allowed characters (letters, numbers, underscores, hyphens)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(groupType)) {
      return false;
    }

    // Additional business rules
    return this.isAllowedGroupType(groupType);
  }

  private isAllowedGroupType(groupType: string): boolean {
    // Define restricted group types that are not allowed
    const restrictedGroupTypes = [
      'system',
      'internal',
      'secret',
      'private',
      'admin_internal',
      'config_internal',
    ];

    const normalizedGroupType = groupType.toLowerCase();

    // Check if group type is in restricted list
    if (restrictedGroupTypes.includes(normalizedGroupType)) {
      return false;
    }

    // Check for reserved prefixes
    const restrictedPrefixes = ['sys_', 'internal_', 'secret_'];
    const hasRestrictedPrefix = restrictedPrefixes.some((prefix) =>
      normalizedGroupType.startsWith(prefix)
    );

    if (hasRestrictedPrefix) {
      return false;
    }

    return true;
  }
}
