import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create.user.dto'
import { UpdateUserDto } from './dto/update.user.dto'
import { UserResponseDto } from './dto/user.response.dto'

@Controller()
export class UserKafkaController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.findById')
  async findById(@Payload() data: { id: number }) {
    const user = await this.userService.findById(data.id)

    if (!user) {
      return null
    }

    return user
  }

  @MessagePattern('user.findByUsername')
  async findByUsername(@Payload() data: { username: string }) {
    const user = await this.userService.findByUsername(data.username)

    if (!user) {
      return null
    }

    return user
  }

  @MessagePattern('user.findByEmail')
  async findByEmail(@Payload() data: { email: string }) {
    const user = await this.userService.findByEmail(data.email)

    if (!user) {
      return null
    }

    return user
  }

  @MessagePattern('user.create')
  async create(@Payload() dto: CreateUserDto) {
    const user = await this.userService.create(dto)
    return new UserResponseDto(user)
  }

  @MessagePattern('user.update')
  async update(@Payload() data: { id: number; dto: UpdateUserDto }) {
    const user = await this.userService.update(data.id, data.dto)
    return new UserResponseDto(user)
  }

  @MessagePattern('user.delete')
  async delete(@Payload() data: { id: number }) {
    await this.userService.delete(data.id)
    return { message: 'user deleted' }
  }
}
