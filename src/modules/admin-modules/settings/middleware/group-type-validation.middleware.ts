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
    return this.isAllowedGroupType();
  }

  private isAllowedGroupType(): boolean {
    // REMOVED: All restrictions removed for full dynamic flexibility
    // Previously blocked: system, internal, secret, private, admin_internal, config_internal
    // Previously blocked prefixes: sys_, internal_, secret_

    // Now allows ANY groupType including:
    // - site_setting, amount_setting, revenue_setting (user examples)
    // - system, internal, secret (previously blocked)
    // - custom_group_123, API_CONFIG_v2, any-format

    return true; // Accept everything for maximum flexibility
  }
}
