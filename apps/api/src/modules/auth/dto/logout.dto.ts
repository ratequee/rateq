import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Revoke a specific refresh token session. Omit to revoke all sessions.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
