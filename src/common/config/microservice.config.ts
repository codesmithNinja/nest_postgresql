import { registerAs } from '@nestjs/config';

export default registerAs('microservice', () => ({
  main: {
    port: process.env.MAIN_PORT || 3000,
    url: process.env.MAIN_URL || 'http://localhost:3000',
  },
  admin: {
    port: process.env.ADMIN_PORT || 3001,
    url: process.env.ADMIN_URL || 'http://localhost:3001',
  },
  campaign: {
    port: process.env.CAMPAIGN_PORT || 3002,
    url: process.env.CAMPAIGN_URL || 'http://localhost:3002',
  },
  investment: {
    port: process.env.INVESTMENT_PORT || 3003,
    url: process.env.INVESTMENT_URL || 'http://localhost:3003',
  },
}));
