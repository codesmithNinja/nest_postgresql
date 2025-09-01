import { registerAs } from '@nestjs/config';
import { allowedOrigins } from '../config/cors.config';
export default registerAs('app', () => ({
  port: +process.env.PORT || 3000,
  corsAllowedOrigins: allowedOrigins,
  name: process.env.APP_NAME || 'NestJS App',
  url: process.env.API_URL || 'http://localhost:3000',
}));
