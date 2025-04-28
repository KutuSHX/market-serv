import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserRestController } from './user.rest.controller'
import { UserKafkaController } from './user.kafka.controller'
import { KafkaModule } from 'src/kafka/kafka.module'

@Module({
  imports: [KafkaModule],
  providers: [UserService],
  controllers: [UserRestController, UserKafkaController],
  exports: [UserService]
})
export class UserModule {}
