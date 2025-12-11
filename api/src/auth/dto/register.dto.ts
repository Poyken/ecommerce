import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
    minLength: 6,
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
    minLength: 2,
  })
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
    minLength: 2,
  })
  @MinLength(2)
  lastName: string;
}
