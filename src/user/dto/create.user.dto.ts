import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { UserRole } from '@prisma/client'

export class CreateUserDto {
  @IsEmail()
  email: string

  @MinLength(6)
  username: string

  @IsString()
  password: string

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole
}
