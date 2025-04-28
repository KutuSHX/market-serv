import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app/app.module'
import { getKafkaConfig } from './kafka/kafka.config'

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(cookieParser())
  app.setGlobalPrefix('api')

  app.connectMicroservice(getKafkaConfig(config, 'auth-consumer-group'))
  app.connectMicroservice(getKafkaConfig(config, 'user-consumer-group'))

  await app.startAllMicroservices()
  await app.listen(3000)
}

bootstrap()
