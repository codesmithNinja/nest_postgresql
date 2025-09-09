import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

export default registerAs('security', () => {
  try {
    const configPath = join(process.cwd(), 'security-config.yml');
    const configFile = readFileSync(configPath, 'utf8');
    const config = yaml.load(configFile) as Record<string, any>;

    return config.security as Record<string, any>;
  } catch {
    // Fallback configuration if YAML file is not found
    return {
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
      },
      rateLimit: {
        windowMs: 900000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP',
      },
      jwt: {
        expiresIn: '7d',
        issuer: 'campaign-service',
        audience: 'campaign-users',
      },
    };
  }
});
