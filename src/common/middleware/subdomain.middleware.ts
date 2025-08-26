import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.get('host');
    const subdomain = this.extractSubdomain(host);

    // Add subdomain info to request
    req['subdomain'] = subdomain;
    req['microservice'] = this.getMicroserviceType(subdomain);

    next();
  }

  private extractSubdomain(host: string): string {
    if (!host) return 'main';

    const parts = host.split('.');
    if (parts.length < 3) return 'main';

    return parts[0];
  }

  private getMicroserviceType(subdomain: string): string {
    const microserviceMap = {
      admin: 'admin',
      campaign: 'campaign',
      invest: 'investment',
      investment: 'investment',
    };

    return microserviceMap[subdomain] || 'main';
  }
}
