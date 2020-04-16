// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const checkTransactionExists = await transactionsRepository.findOne({
      where: { id },
    });

    if (!checkTransactionExists) {
      throw new Error('Transaction not found');
    }
    await transactionsRepository.delete({ id });
  }
}

export default DeleteTransactionService;
