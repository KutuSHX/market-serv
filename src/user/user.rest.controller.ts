import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post
} from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create.user.dto'
import { UpdateUserDto } from './dto/update.user.dto'
import { UserResponseDto } from './dto/user.response.dto'

@Controller('user')
export class UserRestController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    console.log(id)
    const user = await this.userService.findById(id)
    return user ? new UserResponseDto(user) : null
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto)
    
    return new UserResponseDto(user)
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto
  ) {
    const user = await this.userService.update(id, dto)
    return new UserResponseDto(user)
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.delete(id)
    return { message: 'user deleted' }
  }
}
