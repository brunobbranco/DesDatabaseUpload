import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  titleTransaction: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
  fileName?: string;
}

class CreateTransactionService {
  public async execute({
    titleTransaction,
    value,
    type,
    category,
    fileName,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(
        'Invalid type. Only "income" or "outcome" are allowed',
      );
    }

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('insufficient funds');
    }

    const checkCategoryExists = await categoryRepository.findOne({
      title: category,
    });

    if (checkCategoryExists) {
      try {
        const transaction = transactionsRepository.create({
          title: titleTransaction,
          value: Number(value),
          type,
          category: checkCategoryExists,
          filename: fileName,
        });

        const createdTransaction = await transactionsRepository.save(
          transaction,
        );
        return createdTransaction;
      } catch (err) {
        throw new AppError(err);
      }
    }

    try {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      const transaction = transactionsRepository.create({
        title: titleTransaction,
        value: Number(value),
        type,
        category: newCategory,
        filename: fileName,
      });

      const createdTransaction = await transactionsRepository.save(transaction);
      return createdTransaction;
    } catch (err) {
      throw new AppError(err);
    }
  }
}

export default CreateTransactionService;
