import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CompanyBrandingService } from './company-branding.service';
import { CreateCompanyBrandingDto } from './dto/create-company-branding.dto';
import { UpdateCompanyBrandingDto } from './dto/update-company-branding.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('company-branding')
export class CompanyBrandingController {
  constructor(private readonly brandingService: CompanyBrandingService) {}

  @Post()
  async createOrUpdate(@Body() dto: CreateCompanyBrandingDto) {
    const data = await this.brandingService.createOrUpdate(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Company branding saved successfully',
      data,
    };
  }

  @Public()
  @UseInterceptors(CacheInterceptor)
  @Get()
  async getBranding() {
    const data = await this.brandingService.getBranding();
    return {
      statusCode: HttpStatus.OK,
      message: 'Company branding retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyBrandingDto) {
    const data = await this.brandingService.update(+id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Company branding updated successfully',
      data,
    };
  }
}
