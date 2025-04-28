import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth-service',
              brokers: [config.getOrThrow<string>('KAFKA_BROKER')]
            },
            consumer: {
              groupId: 'auth-consumer-group'
            }
          }
        }),
        inject: [ConfigService]
      }
    ]),
    ClientsModule.registerAsync([
      {
        name: 'USER_KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'user-service',
              brokers: [config.getOrThrow<string>('KAFKA_BROKER')]
            },
            consumer: {
              groupId: 'user-consumer-group'
            }
          }
        }),
        inject: [ConfigService]
      }
    ])
  ],
  exports: [ClientsModule]
})
export class KafkaModule {}
