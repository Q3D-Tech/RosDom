import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { RequestIdMiddleware } from './common/http/request-id.middleware';

function resolveCors() {
  const rawOrigins = process.env.CORS_ORIGIN?.trim();
  if (!rawOrigins || rawOrigins === '*') {
    return true;
  }

  return {
    origin: rawOrigins
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    credentials: true,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: resolveCors(),
  });

  app.use(new RequestIdMiddleware().use);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('v1');

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

void bootstrap();
