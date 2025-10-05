import { useQuery } from '@tanstack/react-query';
import { calculateGasAnalytics } from '../utils/transactionUtils';
import { GasAnalytics } from '../types/token';
import { withRetry } from '../utils/retryWrapper';

export const useGasAnalytics = (address?: string, networkId?: number) => {
  return useQuery({
    queryKey: ['gasAnalytics', address, networkId],
    queryFn: () => withRetry(() => calculateGasAnalytics(address!, networkId!)),
    enabled: !!address && !!networkId,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useMultiChainGasAnalytics = (address?: string, networkIds?: number[]) => {
  return useQuery({
    queryKey: ['multiChainGasAnalytics', address, networkIds],
    queryFn: async (): Promise<GasAnalytics[]> => {
      if (!address || !networkIds || networkIds.length === 0) return [];

      const analyticsPromises = networkIds.map(networkId =>
        withRetry(() => calculateGasAnalytics(address, networkId))
      );

      return Promise.all(analyticsPromises);
    },
    enabled: !!address && !!networkIds && networkIds.length > 0,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};
