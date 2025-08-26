import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvestmentModule } from './microservices/investment/investment.module';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(InvestmentModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Enable CORS for investment domain
  app.enableCors({
    origin: [
      /^https?:\/\/invest\..*$/,
      /^https?:\/\/investment\..*$/,
      /^https?:\/\/localhost:\d+$/,
      /^https?:\/\/127\.0\.0\.1:\d+$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Trust proxy
  app.set('trust proxy', true);

  const configService = app.get(ConfigService);
  const port = configService.get('microservice.investment.port') || 3003;

  await app.listen(port);
  console.log(`Investment Service is running on: http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Error starting investment service:', err);
});
