import { IsEmail, IsString, IsEmpty } from 'class-validator'

export class LoginDto {
  @IsEmail()
  @IsEmpty()
  email: string

  @IsString()
  @IsEmpty()
  password: string
}
