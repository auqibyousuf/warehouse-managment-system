import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  salesService,
  CreateSaleInput,
  RecordCustomerPaymentInput,
} from '../../services/api/salesService';

export const useSalesInvoices = () => {
  return useQuery({
    queryKey: ['sales', 'invoices'],
    queryFn: () => salesService.getInvoices(),
  });
};

export const useCustomerPayments = () => {
  return useQuery({
    queryKey: ['sales', 'payments'],
    queryFn: () => salesService.getPayments(),
  });
};

export const useCreateSaleInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesService.createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordCustomerPaymentInput) => salesService.recordPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason?: string }) =>
      salesService.cancelInvoice(invoiceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
