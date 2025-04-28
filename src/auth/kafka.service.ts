import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  InternalServerErrorException
} from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { User } from '@prisma/client'
import { firstValueFrom } from 'rxjs'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthKafkaService implements OnModuleDestroy, OnModuleInit {
  constructor(
    @Inject('AUTH_KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  private readonly logger = new Logger()

  async onModuleInit() {
    ;['user.findByEmail', 'user.create'].forEach((topic) => {
      this.kafkaClient.subscribeToResponseOf(topic)

      this.logger.log(`Subscribed to ${topic}`)
    })

    try {
      await this.kafkaClient.connect()

      this.logger.log('Kafka client connected successfully')
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error.stack)

      throw error
    }
  }

  async onModuleDestroy() {
    await this.kafkaClient.close()
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await firstValueFrom(
        this.kafkaClient.send('user.findByEmail', { email })
      )
    } catch (error) {
      this.logger.error(`Kafka error in getUserByEmail: ${error.message}`)

      throw new InternalServerErrorException('Failed to get user by email')
    }
  }

  async create(dto: RegisterDto): Promise<User> {
    try {
      return await firstValueFrom(
        this.kafkaClient.send('user.create', dto)
      )
    } catch (error) {
      this.logger.error(`Kafka error in create: ${error.message}`)

      throw new InternalServerErrorException('Failed to create user')
    }
  }
}
