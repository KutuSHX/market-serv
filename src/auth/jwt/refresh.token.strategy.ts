import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { JwtPayload } from './jwt.payload.interface'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true
    })
  }

  validate(payload: JwtPayload, req: Request) {
    const refreshToken = req.headers['authorization']?.split(' ')[1]
    
    return { ...payload, refreshToken }
  }
}
