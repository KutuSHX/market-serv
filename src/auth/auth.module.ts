import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { KafkaModule } from 'src/kafka/kafka.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AccessTokenStrategy } from './jwt/access.token.strategy'
import { RefreshTokenStrategy } from './jwt/refresh.token.strategy'
import { JwtAuthGuard } from './guards/jwt.auth.guard'
import { TokenRefreshInterceptor } from './interceptors/token.refresh.interceptor'
import { AuthKafkaService } from './kafka.service'
import { CookieService } from './cookie.service'

@Module({
  imports: [
    KafkaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthKafkaService,
    AccessTokenStrategy,
    CookieService,
    RefreshTokenStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TokenRefreshInterceptor
    }
  ],
  exports: [AuthService, AuthKafkaService]
})
export class AuthModule {}
