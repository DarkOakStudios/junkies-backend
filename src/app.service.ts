import { Injectable } from '@nestjs/common';
import * as xrpl from 'xrpl';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async setupToken() {
    return new Promise<string>(async (resolve, reject) => {
      console.log('Setuping token...');

      const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const hot_wallet = (await client.fundWallet()).wallet;
      const cold_wallet = (await client.fundWallet()).wallet;

      console.log(`${hot_wallet.address} and ${cold_wallet.address}`);

      const cst_prepared = await client.autofill({
        TransactionType: 'AccountSet',
        Account: cold_wallet.address,
        TransferRate: 0,
        TickSize: 5,
        Domain: '6675656C65646F6E6261636F6E2E636F6D', // "fueledonbacon.com"
        SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
        Flags:
          xrpl.AccountSetTfFlags.tfDisallowXRP |
          xrpl.AccountSetTfFlags.tfRequireDestTag,
      });

      let cst_result;
      try {
        const cst_signed = cold_wallet.sign(cst_prepared);
        console.log('Sending cold address AccountSet transaction...');
        cst_result = await client.submitAndWait(cst_signed.tx_blob);
        console.log(
          `Transaction succeeded: https://testnet.xrpl.org/transactions/${cst_signed.hash}`,
        );
      } catch (error) {
        reject(`Error sending transaction: ${cst_result}`);
      }

      const hst_prepared = await client.autofill({
        TransactionType: 'AccountSet',
        Account: hot_wallet.address,
        Domain: '6675656C65646F6E6261636F6E2E636F6D', // "fueledonbacon.com"
        SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
        Flags:
          xrpl.AccountSetTfFlags.tfDisallowXRP |
          xrpl.AccountSetTfFlags.tfRequireDestTag,
      });

      let hst_result;
      try {
        const hst_signed = hot_wallet.sign(hst_prepared);
        console.log('Sending hot address AccountSet transaction...');
        hst_result = await client.submitAndWait(hst_signed.tx_blob);
        console.log(
          `Transaction succeeded: https://testnet.xrpl.org/transactions/${hst_signed.hash}`,
        );
      } catch (error) {
        reject(
          `Error sending transaction: ${hst_result.result.meta.TransactionResult}`,
        );
      }

      const currency_code = 'JUK'; // from docs: "Currency codes must be exactly 3 ASCII characters in length"

      const ts_prepared = await client.autofill({
        TransactionType: 'TrustSet',
        Account: hot_wallet.address,
        LimitAmount: {
          currency: currency_code,
          issuer: cold_wallet.address,
          value: '10000000000',
        },
      });

      let ts_result;
      try {
        const ts_signed = hot_wallet.sign(ts_prepared);
        console.log('Creating trust line from hot address to issuer...');
        ts_result = await client.submitAndWait(ts_signed.tx_blob);
        console.log(
          `Transaction succeeded: https://testnet.xrpl.org/transactions/${ts_signed.hash}`,
        );
      } catch (error) {
        reject(`Error sending transaction: ${error.message}`);
      }

      const dev_wallet = 'r4ikaBeHkuFY1VZG56LQUwvKRqPjvkFD5x'; // my dev account

      const ts_prepared_2 = await client.autofill({
        TransactionType: 'TrustSet',
        Account: hot_wallet.address,
        LimitAmount: {
          currency: currency_code,
          issuer: dev_wallet,
          value: '10000000000',
        },
      });

      let ts_result_2;
      try {
        const ts_signed_2 = hot_wallet.sign(ts_prepared_2);
        console.log('Creating trust line from hot address to dev wallet...');
        ts_result_2 = await client.submitAndWait(ts_signed_2.tx_blob);
        console.log(
          `Transaction succeeded: https://testnet.xrpl.org/transactions/${ts_signed_2.hash}`,
        );
      } catch (error) {
        reject(`Error sending transaction: ${error.message} and ${ts_result_2}`);
      }

      // Send token ----------------------------------------------------------------
      const issue_quantity = '100';

      const pay_prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: cold_wallet.address,
        Amount: {
          currency: currency_code,
          value: issue_quantity,
          issuer: cold_wallet.address,
        },
        Destination: hot_wallet.address,
        // Destination: dev_wallet,
        DestinationTag: 1,
      });

      let pay_result;
      try {
        const pay_signed = cold_wallet.sign(pay_prepared);
        console.log(
          `Sending ${issue_quantity} ${currency_code} to ${dev_wallet}...`,
        );
        pay_result = await client.submitAndWait(pay_signed.tx_blob);
        console.log(
          `Transaction succeeded: https://testnet.xrpl.org/transactions/${pay_signed.hash}`,
        );
      } catch (error) {
        reject(`Error sending transaction: ${error.message} and ${pay_result}`);
      }

      // Check balances ------------------------------------------------------------
      console.log('Getting hot address balances...');
      const hot_balances = await client.request({
        command: 'account_lines',
        account: hot_wallet.address,
        ledger_index: 'validated',
      });
      console.log(hot_balances.result);

      client.disconnect();
      resolve(ts_result);
    });
  }
}
