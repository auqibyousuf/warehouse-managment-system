import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productionService,
  CreateBatchInput,
  CreateSetupInput,
} from '../../services/api/productionService';
import { SetupStatus } from '../../types';

export const useProductionSetups = () => {
  return useQuery({
    queryKey: ['production', 'setups'],
    queryFn: () => productionService.getSetups(),
  });
};

export const useProductionBatches = () => {
  return useQuery({
    queryKey: ['production', 'batches'],
    queryFn: () => productionService.getBatches(),
  });
};

export const useCreateProductionSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSetupInput) => productionService.createSetup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'setups'] });
    },
  });
};

export const useUpdateProductionSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateSetupInput> }) =>
      productionService.updateSetup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'setups'] });
    },
  });
};

export const useSetSetupStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SetupStatus }) =>
      productionService.setSetupStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'setups'] });
    },
  });
};

export const useCreateProductionBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchInput) => productionService.createBatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useReverseProductionBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, reason }: { batchId: string; reason?: string }) =>
      productionService.reverseBatch(batchId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteProductionSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productionService.deleteSetup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'setups'] });
    },
  });
};
