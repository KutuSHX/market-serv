import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { UserRole } from '@prisma/client'

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  username?: string

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole
}
