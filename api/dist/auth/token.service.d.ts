import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateTokens(userId: string, permissions?: string[]): {
        accessToken: string;
        refreshToken: string;
    };
    getRefreshTokenExpirationTime(): number;
    private parseDuration;
    validateRefreshToken(token: string): any;
}
