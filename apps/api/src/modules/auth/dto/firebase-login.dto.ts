import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase ID token from client SDK' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
