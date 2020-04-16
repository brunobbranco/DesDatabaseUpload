import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
import Balance from '../models/Balance';

// interface Balance {
//   income: number;
//   outcome: number;
//   total: number;
// }

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = this.somaPor(transactions, 'income');
    const outcome = this.somaPor(transactions, 'outcome');
    const total = income - outcome;

    const balance = new Balance({ income, outcome, total });

    return balance;
  }

  // eslint-disable-next-line class-methods-use-this
  private somaPor(objArray: Transaction[], typeKey: string): number {
    let retorno = 0;
    return objArray.reduce((acc, objAtual) => {
      if (objAtual.type === typeKey) {
        retorno = acc + objAtual.value;
      }

      return retorno;
    }, 0);
  }
}

export default TransactionsRepository;
