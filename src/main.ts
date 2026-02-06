import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Allo Hiring – Inventory API')
    .setDescription(
      'Inventory API: products, warehouses, stock, and reservations.',
    )
    .setVersion('1.0')
    .addTag('products', 'Product catalog')
    .addTag('warehouses', 'Warehouse management')
    .addTag('stock', 'Stock levels and adjustments')
    .addTag('reservations', 'Stock reservations (reserve, release, confirm)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
