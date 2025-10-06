import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

interface SecurityConfig {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: string[];
        styleSrc: string[];
        scriptSrc: string[];
        imgSrc: string[];
        connectSrc: string[];
        fontSrc: string[];
        objectSrc: string[];
        mediaSrc: string[];
        frameSrc: string[];
      };
    };
    crossOriginEmbedderPolicy: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
  };
  jwt: {
    expiresIn: string;
    issuer: string;
    audience: string;
  };
}

export default registerAs('security', (): SecurityConfig => {
  try {
    const configPath = join(process.cwd(), 'security-config.yml');
    const configFile = readFileSync(configPath, 'utf8');
    const config = yaml.load(configFile) as { security: SecurityConfig };

    return config.security;
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
