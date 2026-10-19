import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../../services/api/dashboardService';
import { FilterPeriod } from '../../stores/useAppStore';
import { FactorySettings } from '../../types';

export const useDashboardMetrics = (period: FilterPeriod) => {
  return useQuery({
    queryKey: ['dashboard', 'metrics', period],
    queryFn: () => dashboardService.getMetrics(period),
  });
};

export const useFactorySettings = () => {
  return useQuery({
    queryKey: ['factory', 'settings'],
    queryFn: () => dashboardService.getFactorySettings(),
  });
};

export const useUpdateFactorySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSettings: Partial<FactorySettings>) =>
      dashboardService.updateFactorySettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factory', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
