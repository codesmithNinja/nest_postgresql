import { registerAs } from '@nestjs/config';
import { DatabaseType } from '../enums/database-type.enum';

export default registerAs('database', () => ({
  type: (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES,
  postgres: {
    url: process.env.DATABASE_URL,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
}));
