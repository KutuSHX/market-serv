import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException
} from '@nestjs/common'
import { Observable, throwError, from } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'
import { Response } from 'express'
import { AuthService } from '../auth.service'
import { CookieService } from '../cookie.service'

@Injectable()
export class TokenRefreshInterceptor implements NestInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error.status === 401) {
          const ctx = context.switchToHttp()
          const req = ctx.getRequest()
          const res = ctx.getResponse<Response>()
          const refreshToken = req.cookies?.refreshToken

          if (!refreshToken) {
            return throwError(() => error)
          }

          // Обернем Promise в Observable с помощью from()
          return from(this.authService.refreshTokens(refreshToken)).pipe(
            switchMap((tokens) => {
              this.cookieService.setAuthCookie(
                res,
                tokens.accessToken,
                'accessToken',
                15 * 60 * 1000
              )
              this.cookieService.setAuthCookie(
                res,
                tokens.refreshToken,
                'refreshToken',
                7 * 24 * 60 * 60 * 1000
              )

              return next.handle()
            }),
            catchError(() => throwError(() => error))
          )
        }
        return throwError(() => error)
      })
    )
  }
}
