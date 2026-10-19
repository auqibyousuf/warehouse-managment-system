import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryService,
  RecordPurchaseInput,
  AdjustStockInput,
} from '../../services/api/inventoryService';

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: () => inventoryService.getItems(),
  });
};

export const useIngredients = () => {
  return useQuery({
    queryKey: ['inventory', 'ingredients'],
    queryFn: () => inventoryService.getIngredients(),
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: () => inventoryService.getProducts(),
  });
};

export const useInventoryMovements = () => {
  return useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: () => inventoryService.getMovements(),
  });
};

export const useRecordPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPurchaseInput) => inventoryService.recordPurchase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustStockInput) => inventoryService.adjustStock(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const usePurchases = () => {
  return useQuery({
    queryKey: ['inventory', 'purchases'],
    queryFn: () => inventoryService.getPurchases(),
  });
};

export const useCreateIngredient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      category?: 'raw_material' | 'packaging';
      unit: string;
      unitCost: number;
      initialStock?: number;
      minThreshold?: number;
    }) => inventoryService.createIngredient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      name?: string;
      category?: 'raw_material' | 'packaging';
      unit?: string;
      unitCost?: number;
      minThreshold?: number;
      currentStock?: number;
    }) => inventoryService.updateIngredient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};


export const useSuppliers = () => {
  return useQuery({
    queryKey: ['inventory', 'suppliers'],
    queryFn: () => inventoryService.getSuppliers(),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      phone: string;
      address?: string;
      gstNumber?: string;
    }) => inventoryService.createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
    },
  });
};

