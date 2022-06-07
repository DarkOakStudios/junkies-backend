import { Controller, Get, Param, Sse } from '@nestjs/common'
import { firstValueFrom, Observable } from 'rxjs'
import { PayWithFtService } from './pay-with-ft.service'

@Controller('pay-with-ft')
export class PayWithFtController {
  constructor(private readonly payService: PayWithFtService) {}

  @Get('/token-data/:uuid')
  async getUserData(@Param() params) {
    console.log(params.uuid)
    const data = await firstValueFrom(await this.payService.getTokenData(params.uuid))
    return { data }
  }

  @Sse('sse/:account')
  sse(@Param() parameters): Observable<any> {
    return this.payService.pay(parameters.account)
  }
}
