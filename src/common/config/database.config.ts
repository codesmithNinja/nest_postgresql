import { registerAs } from '@nestjs/config';
import { DatabaseType } from '../enums/database-type.enum';

export default registerAs('database', () => {
  const dbType =
    (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;

  // Validate environment variables based on database type
  if (dbType === DatabaseType.POSTGRES) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is required when DATABASE_TYPE=postgres'
      );
    }
  } else if (dbType === DatabaseType.MONGODB) {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI environment variable is required when DATABASE_TYPE=mongodb'
      );
    }
  } else {
    throw new Error(
      `Invalid DATABASE_TYPE: ${dbType as string}. Must be 'postgres' or 'mongodb'`
    );
  }

  return {
    type: dbType,
    postgres: {
      url: process.env.DATABASE_URL,
    },
    mongodb: {
      uri: process.env.MONGODB_URI,
    },
  };
});
