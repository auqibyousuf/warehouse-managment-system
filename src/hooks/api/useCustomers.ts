import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CreateCustomerInput } from '../../services/api/customerService';

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customerService.createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
