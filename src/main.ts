import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AppService } from './app.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  const appService = app.get(AppService)
  await app.listen(process.env.PORT || 5000)
  await appService.setupToken()
  console.log(`Application is running on: ${await app.getUrl()}`)
}
bootstrap()
