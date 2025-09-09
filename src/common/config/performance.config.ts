import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

export default registerAs('performance', () => {
  try {
    const configPath = join(process.cwd(), 'performance-config.yml');
    const configFile = readFileSync(configPath, 'utf8');
    const config = yaml.load(configFile) as Record<string, any>;

    return config.performance as Record<string, any>;
  } catch {
    // Fallback configuration if YAML file is not found
    return {
      database: {
        postgres: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
        mongodb: {
          maxPoolSize: 100,
          minPoolSize: 5,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
        },
      },
      cache: {
        redis: {
          host: 'redis',
          port: 6379,
          ttl: 3600,
          maxMemoryPolicy: 'allkeys-lru',
        },
        nodeCache: {
          stdTTL: 600,
          checkperiod: 120,
          maxKeys: 1000,
        },
      },
      upload: {
        maxFileSize: 104857600, // 100MB
        allowedMimeTypes: {
          images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          videos: ['video/mp4', 'video/webm', 'video/ogg'],
          documents: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        },
      },
    };
  }
});
