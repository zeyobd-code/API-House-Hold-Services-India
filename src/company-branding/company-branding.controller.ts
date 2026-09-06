import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CompanyBrandingService } from './company-branding.service';
import { CreateCompanyBrandingDto } from './dto/create-company-branding.dto';
import { UpdateCompanyBrandingDto } from './dto/update-company-branding.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('company-branding')
export class CompanyBrandingController {
  constructor(
    private readonly brandingService: CompanyBrandingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async clearCache() {
    try {
      if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      }
    } catch {
      // Ignore cache reset errors
    }
  }

  @Public()
  @Post()
  async createOrUpdate(@Body() dto: CreateCompanyBrandingDto) {
    const data = await this.brandingService.createOrUpdate(dto);
    await this.clearCache();
    return {
      statusCode: HttpStatus.OK,
      message: 'Company branding saved successfully',
      data,
    };
  }

  @Public()
  @Get()
  async getBranding() {
    const data = await this.brandingService.getBranding();
    return {
      statusCode: HttpStatus.OK,
      message: 'Company branding retrieved successfully',
      data,
    };
  }

  @Public()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyBrandingDto) {
    const data = await this.brandingService.update(+id, dto);
    await this.clearCache();
    return {
      statusCode: HttpStatus.OK,
      message: 'Company branding updated successfully',
      data,
    };
  }
}

