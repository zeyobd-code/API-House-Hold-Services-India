import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const randomName = Array(16)
      .fill(null)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    return cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

const imageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/i)) {
    return cb(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }
  cb(null, true);
};

const interceptorLimits = {
  fileSize: 10 * 1024 * 1024, // 10 MB limit
};

@Controller('upload')
export class UploadController {
  private buildUploadResponse(file: any, req: Request) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded or file is not supported',
      );
    }

    let host = process.env.APP_URL;
    if (!host) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const hostHeader = (req.headers['x-forwarded-host'] as string) || req.get('host');
      
      if (hostHeader && !hostHeader.includes('sslip.io') && !hostHeader.includes('localhost')) {
        host = `${proto}://${hostHeader}`;
      } else {
        host = 'https://api.rajseba.in';
      }
    }
    
    // Clean trailing slashes
    host = host.replace(/\/+$/, '');

    const url = `${host}/uploads/${file.filename}`;

    return {
      statusCode: HttpStatus.OK,
      message: 'File uploaded successfully',
      success: true,
      url,
      data: {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url,
      },
    };
  }

  @Public()
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig,
      fileFilter: imageFileFilter,
      limits: interceptorLimits,
    }),
  )
  uploadFile(@UploadedFile() file: any, @Req() req: Request) {
    return this.buildUploadResponse(file, req);
  }

  @Public()
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig,
      fileFilter: imageFileFilter,
      limits: interceptorLimits,
    }),
  )
  uploadImageAlias(@UploadedFile() file: any, @Req() req: Request) {
    return this.buildUploadResponse(file, req);
  }
}

