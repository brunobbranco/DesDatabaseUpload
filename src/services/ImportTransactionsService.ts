/* eslint-disable dot-notation */
// import csvParser from 'csv-parser';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, In, getCustomRepository } from 'typeorm';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  fileName: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
  filename: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, fileName);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const transactions: TransactionDTO[] = [];
    const categories: string[] = [];

    try {
      const transactionsRS = fs.createReadStream(filePath);

      const parseTransactions = csvParse({
        from_line: 2,
      });

      const parseCSV = transactionsRS.pipe(parseTransactions);

      parseCSV.on('data', async row => {
        const [title, type, value, category] = row.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value) return;

        categories.push(category);

        transactions.push({ title, type, value, category, filename: fileName });
      });

      await new Promise(resolve => parseCSV.on('end', resolve));
    } catch (err) {
      throw new AppError('Error reading file');
    }

    try {
      const existentCategories = await categoriesRepository.find({
        where: {
          title: In(categories),
        },
      });

      const existentCategoriesTitle = existentCategories.map(
        (category: Category) => category.title,
      );

      const addCategoryTitles = categories
        .filter(category => !existentCategoriesTitle.includes(category))
        .filter((value, index, self) => self.indexOf(value) === index);

      const newCategories = categoriesRepository.create(
        addCategoryTitles.map(title => ({
          title,
        })),
      );

      await categoriesRepository.save(newCategories);

      const finalCategories = [...newCategories, ...existentCategories];

      const createdTransactions = transactionsRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(
            category => category.title === transaction.category,
          ),
          filename: transaction.filename,
        })),
      );

      await transactionsRepository.save(createdTransactions);

      return createdTransactions;
    } catch (err) {
      throw new AppError('Error saving data to database');
    }
  }
}

export default ImportTransactionsService;
