import { Injectable } from '@nestjs/common'
import { XummSdk } from 'xumm-sdk'
import { Subject, map } from 'rxjs'
import { HttpService } from '@nestjs/axios'
import * as xrpl from 'xrpl'

@Injectable()
export class PayWithFtService {
  private readonly sdk: XummSdk
  private emitter = new Subject()

  constructor(private httpService: HttpService) {
    this.sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET)
  }

  async getTokenData(uuid: string) {
    return this.httpService
      .get(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
        headers: {
          'X-API-Key': process.env.API_KEY,
          'X-API-Secret': process.env.API_SECRET,
          'Access-Control-Allow-Origin': '*',
          Accept: 'application/json'
        }
      })
      .pipe(map(response => response.data))
  }

  pay(account: string): Subject<any> {
    this.sdk.payload
      .createAndSubscribe(
        {
          TransactionType: 'Payment',
          Account: account,
          Amount: {
            currency: 'JUK',
            value: '1',
            issuer: account
          }
        } as any,
        event => {
          this.emitter.next(JSON.stringify(event.data))
        }
      )
      .then(result => {
        this.emitter.next(result.created.next.always)
      })
    return this.emitter
  }
}
