import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    cors: true,
  });

  // ============ Static Assets (uploads) ============
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it does not exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Uploads directory created');
    }
    
    app.useStaticAssets(uploadsDir, {
      prefix: '/uploads',
    });
    console.log('✅ Static assets configured');
  } catch (error) {
    console.warn('⚠️ Static assets initialization skipped:', error.message);
  }

  // ============ Security Headers ============
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }));

  // ============ Compression ============
  app.use(compression());

  // ============ CORS Configuration ============
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  // ============ Global Validation Pipe ============
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============ Global Exception Filter ============
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ============ Swagger Documentation ============
  const config = new DocumentBuilder()
    .setTitle('Rajseba API')
    .setDescription('Rajseba Backend API Services')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication')
    .addTag('Users', 'User Management')
    .addTag('Services', 'Service Management')
    .addTag('Bookings', 'Booking Management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ============ Graceful Shutdown ============
  app.enableShutdownHooks();

  // ============ Start Server ============
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);
  
  console.log(`🚀 Server is running on http://${host}:${port}`);
  console.log(`📚 Swagger docs: http://${host}:${port}/api/docs`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL ? 'Configured ✅' : 'Not configured ❌'}`);
}

// ============ Bootstrap ============
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  console.error('Error details:', error.stack);
  process.exit(1);
});
