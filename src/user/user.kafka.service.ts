import { Inject, Injectable } from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { CreateUserDto } from './dto/create.user.dto'

@Injectable()
export class UserKafkaService {
  constructor(
    @Inject('USER_KAFKA_SERVICE') protected readonly client: ClientKafka
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect()
    } catch (error) {
      throw error
    }
  }

  async onModuleDestroy() {
    await this.client.close()
  }

  async createUser(dto: CreateUserDto) {
    return this.client.emit('user.create', dto)
  }

  async findUserByEmail(email: string) {
    return this.client.send('user.findByEmail', { email })
  }
}
