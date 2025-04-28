import { ConfigService } from '@nestjs/config'
import { KafkaOptions, Transport } from '@nestjs/microservices'

export const getKafkaConfig = (
  config: ConfigService,
  groupId: string
): KafkaOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: groupId,
      brokers: [config.getOrThrow<string>('KAFKA_BROKER')]
    },
    consumer: {
      groupId
    }
  }
})
