import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException
} from '@nestjs/common'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { CookieService } from './cookie.service'
import { JwtAuthGuard } from './guards/jwt.auth.guard'
import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { AuthGuard } from '@nestjs/passport'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService
  ) {}

  @ApiOperation({ summary: 'Get current user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    return {
      status: 'success',
      user: req.user
    }
  }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.login(dto)

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

    return {
      status: 'success',
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    }
  }

  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @UseGuards(AuthGuard)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw new UnauthorizedException('refresh token is missing')
    }

    try {
      const tokens = await this.authService.refreshTokens(refreshToken)

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

      return {
        status: 'success',
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      }
    } catch (error) {
      console.log('refresh token failed', error)

      throw new UnauthorizedException('invalid or expired refresh token')
    }
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto)

    return {
      status: 'success',
      tokens: {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken
      }
    }
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw new UnauthorizedException('refresh token is missing')
    }

    try {
      /*await this.authService.logout({
        userId: req.user.id,
        refreshToken
      })*/

      this.cookieService.clearAuthCookie(res, 'accessToken')
      this.cookieService.clearAuthCookie(res, 'refreshToken')

      return {
        status: 'success',
        message: 'Logged out successfully'
      }
    } catch (error) {
      console.error('Logout faield:', error)

      throw new UnauthorizedException('Logout failed')
    }
  }
}
