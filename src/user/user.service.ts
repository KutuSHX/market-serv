import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { CreateUserDto } from './dto/create.user.dto'
import { UpdateUserDto } from './dto/update.user.dto'
import { UserRole, User } from '@prisma/client'
import { Prisma } from '@prisma/client'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } })

      return user ?? null
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({ where: { email } })

      return user ?? null
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { username } })
      
      return user ?? null
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    const [emailExists, usernameExists] = await Promise.all([
      this.findByEmail(dto.email),
      this.findByUsername(dto.username)
    ])

    if (emailExists) {
      throw new ConflictException('email already exists')
    }

    if (usernameExists) {
      throw new ConflictException('username already exists')
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10)

      return await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          password: hashedPassword,
          role: dto.role || UserRole.USER
        }
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id)

    if (!user) {
      throw new NotFoundException('user is not found')
    }

    try {
      const updateData: Partial<User> = {
        ...dto,
        role: dto.role || user.role
      }

      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, 10)
      }

      return await this.prisma.user.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id)

    if (!user) {
      throw new NotFoundException('user is not found')
    }

    try {
      await this.prisma.user.delete({ where: { id } })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  private handlePrismaError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          const fields = Array.isArray(error.meta?.target)
            ? error.meta.target.join(', ')
            : 'unknown fields'

          throw new ConflictException(
            `Unique constraint failed on fields: ${fields}`
          )

        case 'P2025':
          throw new NotFoundException('Record not found')

        default:
          throw new InternalServerErrorException('Database request failed')
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new InternalServerErrorException(
        'Invalid data format sent to database'
      )
    }

    throw new InternalServerErrorException('Unexpected server error')
  }
}
