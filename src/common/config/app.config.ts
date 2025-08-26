import { registerAs } from '@nestjs/config';
import { allowedOrigins } from '../config/cors.config';
export default registerAs('app', () => ({
  enableMicroservices: process.env.ENABLE_MICROSERVICES === 'true',
  ports: {
    main: +process.env.MAIN_PORT || 3000,
    admin: +process.env.ADMIN_PORT || 3001,
    campaign: +process.env.CAMPAIGN_PORT || 3002,
    investment: +process.env.INVESTMENT_PORT || 3003,
  },
  corsAllowedOrigins: allowedOrigins,
  name: process.env.APP_NAME || 'NestJS App',
  url: process.env.API_URL || 'http://localhost:3000',
}));
