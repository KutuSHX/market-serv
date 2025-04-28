import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request, Response } from 'express'
import { AuthService } from '../auth.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    const accessToken = request.cookies?.accessToken
    const refreshToken = request.cookies?.refreshToken

    try {
      const payload = await this.authService.verify(accessToken)

      request.user = payload

      return true
    } catch {
      if (!refreshToken) throw new UnauthorizedException('Invalid token')

      try {
        const refreshPayload = await this.authService.verify(refreshToken)

        const newTokens = await this.authService.generateTokens(refreshPayload)

        response.cookie('accessToken', newTokens.accessToken, {
          httpOnly: true,
          maxAge: 15 * 60 * 1000,
          path: '/'
        })

        const newPayload = await this.authService.verify(newTokens.accessToken)

        request.user = newPayload

        return true
      } catch (error) {
        console.error(error)

        throw new UnauthorizedException('Invalid refresh token')
      }
    }
  }
}
