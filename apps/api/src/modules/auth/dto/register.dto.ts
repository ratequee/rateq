import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@rateq/types';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password!: string;

  @ApiPropertyOptional({ enum: [UserRole.USER, UserRole.COMPANY], default: UserRole.USER })
  @IsOptional()
  @IsIn([UserRole.USER, UserRole.COMPANY])
  role?: UserRole.USER | UserRole.COMPANY;
}
