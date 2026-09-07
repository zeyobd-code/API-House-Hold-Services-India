import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller(['auth', 'api/auth'])
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data,
    };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body('idToken') idToken: string, @Body('token') token: string) {
    const googleToken = idToken || token;
    const data = await this.googleAuthService.googleLoginWithToken(googleToken);
    return {
      statusCode: HttpStatus.OK,
      message: 'Google login successful',
      data,
    };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://rajseba.in';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://api.rajseba.in/api/auth/google/callback';

    try {
      const data = await this.googleAuthService.googleCallbackAuth(code, redirectUri);
      const userRole = data.user?.role?.name || 'client';
      const roleString = userRole.toLowerCase().replace(/\s+/g, '');

      return res.redirect(
        `${frontendUrl}/auth/callback?token=${data.accessToken}&refreshToken=${data.refreshToken}&role=${roleString}`
      );
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google Auth Failed')}`
      );
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(refreshTokenDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Token refreshed successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    const result = await this.authService.logout(req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
