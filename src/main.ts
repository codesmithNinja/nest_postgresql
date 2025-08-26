import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedAppModule } from './microservices/main/main.module';
import { corsOptions } from './common/config/cors.config';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Get configuration first
  const tempApp = await NestFactory.create(UnifiedAppModule);
  const configService = tempApp.get(ConfigService);
  const enableMicroservices = configService.get<boolean>(
    'app.enableMicroservices'
  );
  await tempApp.close();

  // Create the actual app with the correct module configuration
  const app = await NestFactory.create<NestExpressApplication>(
    UnifiedAppModule.forRoot(enableMicroservices).module
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Enable CORS with custom origins
  app.enableCors(corsOptions);

  // Trust proxy for correct IP detection
  app.set('trust proxy', true);

  const port: number = configService.get('app.ports.main') || 3000;

  await app.listen(port);

  if (enableMicroservices) {
    console.log(
      `Main Service (Microservices Mode) is running on: http://localhost:${port}`
    );
    console.log('Other services should be started separately');
  } else {
    console.log(
      `Unified Application (Single Port Mode) is running on: http://localhost:${port}`
    );
    console.log('All APIs are available on this single port');
  }
}

bootstrap().catch((err) => {
  console.error('Error starting application:', err);
});
