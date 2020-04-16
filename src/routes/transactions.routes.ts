import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  try {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = transactionsRepository.find();
    const balance = transactionsRepository.getBalance();

    const account = {
      transactions,
      balance,
    };

    return response.json(account);
  } catch (err) {
    return response.status(400).json({ error: err.message });
  }
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  try {
    const createTransaction = new CreateTransactionService();

    const transaction = await createTransaction.execute({
      titleTransaction: title,
      value,
      type,
      category,
    });

    return response.json(transaction);
  } catch (err) {
    return response.status(400).json({ error: err.message });
  }
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  try {
    const deleteTransaction = new DeleteTransactionService();

    await deleteTransaction.execute({ id });

    return response.send();
  } catch (err) {
    return response.status(400).json({ error: err.message });
  }
});

transactionsRouter.post('/import', async (request, response) => {
  // TODO https://www.npmjs.com/package/csv-parser
});

export default transactionsRouter;
