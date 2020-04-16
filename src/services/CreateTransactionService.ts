// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';

interface Request {
  titleTransaction: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    titleTransaction,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getCustomRepository(CategoriesRepository);

    if (type !== 'income' && type !== 'outcome') {
      throw Error('Invalid type. Only "income" or "outcome" are allowed');
    }

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw Error('insufficient funds');
    }

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (checkCategoryExists) {
      const categoryTransaction_id = checkCategoryExists.id;

      const transaction = transactionsRepository.create({
        title: titleTransaction,
        value: Number(value),
        type,
        category_id: categoryTransaction_id,
      });

      return transactionsRepository.save(transaction);
    }
    const newCategory = categoryRepository.create({
      title: category,
    });

    const idNewCategory = await categoryRepository.save(newCategory);

    const transaction = transactionsRepository.create({
      title: titleTransaction,
      value: Number(value),
      type,
      category_id: idNewCategory.id,
    });

    return transactionsRepository.save(transaction);
  }
}

export default CreateTransactionService;
