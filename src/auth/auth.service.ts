import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { AuthKafkaService } from './kafka.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly kafkaService: AuthKafkaService
  ) {}

  async getUserByEmail(email: string): Promise<User | null> {
    try {
        return await this.kafkaService.findByEmail(email)
      
    } catch (error) {
      this.logger.error(`Kafka error in getUserByEmail: ${error.message}`)

      throw new InternalServerErrorException('Failed to get user by email')
    }
  }

  async generateTokens(user: { id: number; email: string, role?: string }): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user?.role
    }

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, { expiresIn: '15m' }),
        this.jwtService.signAsync(payload, { expiresIn: '7d' })
      ])

      if (!accessToken || !refreshToken) {
        throw new Error('token generation returned empty values')
      }

      return { accessToken, refreshToken }
    } catch (error) {
      this.logger.error(`JWT token generation failed: ${error.message}`)

      throw new InternalServerErrorException('Token generation failed')
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

    const user = await this.getUserByEmail(email)

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return user
  }

  async verify(token: string) {
    try {
      return await this.jwtService.verifyAsync(token)
    } catch (error) {
      throw new UnauthorizedException('invalid token')
    }
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password)

    return this.generateTokens(user)
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.getUserByEmail(dto.email)

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    try {
      const user: User = await this.kafkaService.create(dto)

      return this.generateTokens(user)
    } catch (error) {
      this.logger.error(`Kafka error in user.create: ${error.message}`)

      throw new InternalServerErrorException('Failed to register user')
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken)

      return this.generateTokens(payload)
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`)

      throw new UnauthorizedException('Invalid refresh token')
    }
  }
}
