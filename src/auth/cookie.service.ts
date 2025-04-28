import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'

@Injectable()
export class CookieService {
  constructor(private readonly config: ConfigService) {}

  setAuthCookie(
    res: Response,
    token: string,
    name: string, 
    maxAge: number
  ): void {
    res.cookie(name, token, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('MODE') === 'production',
      sameSite: 'strict',
      maxAge
    })
  }

  clearAuthCookie(
    res: Response,
    name: string
  ): void {
    res.clearCookie(name, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('MODE') === 'production',
      sameSite: 'strict',
      path: '/'
    })
  }
}
