import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService, CreateExpenseInput } from '../../services/api/expenseService';

export const useExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expenseService.createExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
