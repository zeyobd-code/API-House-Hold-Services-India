import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { SmsModule } from './sms/sms.module';
import { CategoryModule } from './category/category.module';
import { ServiceModule } from './service/service.module';
import { PackageModule } from './package/package.module';
import { BookingModule } from './booking/booking.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { SubServiceModule } from './sub-service/sub-service.module';
import { NestedServiceModule } from './nested-service/nested-service.module';
import { ReviewModule } from './review/review.module';
import { ProfileModule } from './profile/profile.module';
import { DevisionModule } from './devision/devision.module';
import { DistrictModule } from './district/district.module';
import { AreaModule } from './area/area.module';
import { ChatModule } from './chat/chat.module';
import { GetwayModule } from './getway/getway.module';
import { CouponModule } from './coupon/coupon.module';
import { ContactModule } from './contact/contact.module';
import { NotificationModule } from './notification/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HeroModule } from './hero/hero.module';
import { CustomShiftingModule } from './custom-shifting/custom-shifting.module';
import { HelpModule } from './help/help.module';
import { ManualInvoiceModule } from './manual-invoice/manual-invoice.module';
import { BlogModule } from './blog/blog.module';
import { CustomRequestModule } from './custom-request/custom-request.module';
import { CompanyBrandingModule } from './company-branding/company-branding.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Auto-sync tables in all environments since migrations are not configured
        logging: false, // Turn off DB logging in performance mode
        ssl: configService.get<string>('DATABASE_SSL') === 'false'
          ? false
          : { rejectUnauthorized: false },
        extra: {
          max: 25, // Expanded connection pool to easily handle 3000+ concurrent user request bursts
          min: 5,   // Maintain warm min connection pool for instantaneous query execution
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000, // Give Neon serverless cold start enough time (10s) to awaken without throwing instant 500 error
          statement_timeout: 15000, // Terminate stuck DB queries after 15s to keep backend worker threads responsive
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20000, // Raised rate limit threshold for heavy concurrent user bursts
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes cache TTL
      max: 2000, // Expanded cache capacity for high traffic scale
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    SmsModule,
    CategoryModule,
    ServiceModule,
    PackageModule,
    BookingModule,
    WithdrawModule,
    SubServiceModule,
    NestedServiceModule,
    ReviewModule,
    ProfileModule,
    DevisionModule,
    DistrictModule,
    AreaModule,
    ChatModule,
    GetwayModule,
    CouponModule,
    ContactModule,
    NotificationModule,
    DashboardModule,
    HeroModule,
    CustomShiftingModule,
    HelpModule,
    ManualInvoiceModule,
    BlogModule,
    CustomRequestModule,
    CompanyBrandingModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
