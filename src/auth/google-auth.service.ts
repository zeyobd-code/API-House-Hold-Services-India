import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { AuthService } from './auth.service';
import { RoleType } from '../roles/entities/role.entity';

@Injectable()
export class GoogleAuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly authService: AuthService,
  ) {
    const clientId = this.configService.get<string>('CLIENT_ID') || this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.CLIENT_ID;
    const clientSecret = this.configService.get<string>('CLIENT_SECRET') || this.configService.get<string>('GOOGLE_CLIENT_SECRET') || process.env.CLIENT_SECRET;
    this.googleClient = new OAuth2Client({ clientId, clientSecret });
  }

  async googleLoginWithToken(idToken: string) {
    let payload;
    try {
      const clientId = this.configService.get<string>('CLIENT_ID') || this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.CLIENT_ID;
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (!payload || !payload.email) {
      throw new BadRequestException('Google account must provide an email');
    }

    const { sub: googleId, email, name, picture } = payload;

    // 1. Find user by googleId
    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      // 2. Find user by email
      user = await this.usersService.findByEmail(email);

      if (user) {
        // Link existing user account with Google ID and update avatar if missing
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        await this.usersService.update(user.id, {
          googleId,
          avatar: user.avatar || picture,
        } as any);
      } else {
        // 3. Create new user with Client role
        const roles = await this.rolesService.findAll();
        const clientRole = roles.find(
          (r) => r.name === RoleType.CLIENT || r.name.toLowerCase() === 'client',
        );

        user = await this.usersService.create({
          name: name || email.split('@')[0],
          email,
          roleId: clientRole ? clientRole.id : undefined,
          googleId,
          avatar: picture,
        } as any);
      }
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      throw new BadRequestException('User account is deactivated or blocked');
    }

    await this.usersService.updateLastLogin(user.id);

    // Call generateTokens method from AuthService via explicit helper or casting
    const tokens = await (this.authService as any).generateTokens(
      user.id,
      user.role?.name,
    );

    return {
      user,
      ...tokens,
    };
  }

  async googleCallbackAuth(code: string, redirectUri: string) {
    try {
      const clientId = this.configService.get<string>('CLIENT_ID') || this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.CLIENT_ID;
      const clientSecret = this.configService.get<string>('CLIENT_SECRET') || this.configService.get<string>('GOOGLE_CLIENT_SECRET') || process.env.CLIENT_SECRET;

      const oauth2Client = new OAuth2Client({ clientId, clientSecret, redirectUri });
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.id_token) {
        throw new BadRequestException('Failed to retrieve ID token from Google');
      }

      return this.googleLoginWithToken(tokens.id_token);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Google OAuth authentication failed');
    }
  }
}
