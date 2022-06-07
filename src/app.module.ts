import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthController } from './components/auth/auth.controller'
import { AuthModule } from './components/auth/auth.module'
import { MintModule } from './components/mint/mint.module'
import { ConfigModule } from '@nestjs/config'
import { CombineMetadataModule } from './components/combine-metadata/combine-metadata.module'
import { PayWithFtModule } from './components/pay-with-ft/pay-with-ft.module'

@Module({
  imports: [AuthModule, MintModule, CombineMetadataModule, ConfigModule.forRoot(), PayWithFtModule],
  controllers: [AppController, AuthController],
  providers: [AppService]
})
export class AppModule {}
