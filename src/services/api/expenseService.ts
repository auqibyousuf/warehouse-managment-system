/**
 * BatchIQ - Expense API Service
 * Operating cost categorization and tracking.
 */

import { getDB } from './mockDatabase';
import { simulateNetwork, generateId, nextDocumentNumber } from './apiClient';
import { Expense, ExpenseCategory } from '../../types';

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  paymentStatus?: 'paid' | 'unpaid';
}

export const expenseService = {
  getExpenses: async (): Promise<Expense[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    });
  },

  createExpense: async (input: CreateExpenseInput): Promise<Expense> => {
    return simulateNetwork(() => {
      const db = getDB();
      const expenseId = generateId('exp');
      const expenseNumber = nextDocumentNumber(
        'EXP',
        db.expenses.map((e) => e.expenseNumber),
      );

      const newExpense: Expense = {
        id: expenseId,
        expenseNumber,
        date: input.date,
        category: input.category,
        amount: input.amount,
        description: input.description,
        paymentStatus: input.paymentStatus || 'paid',
      };

      db.expenses.unshift(newExpense);
      return newExpense;
    });
  },
};
