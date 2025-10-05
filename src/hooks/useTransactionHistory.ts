import { useQuery } from '@tanstack/react-query';
import { fetchUnifiedTransactionHistory, categorizeTransaction } from '../utils/transactionUtils';
import { Transaction, TransactionStatus } from '../types/token';
import { withRetry } from '../utils/retryWrapper';

const fetchAndCategorizeTransactions = async (
  address?: string,
  networkIds?: number[]
): Promise<Transaction[]> => {
  if (!address || !networkIds || networkIds.length === 0) return [];

  const transactions = await withRetry(() =>
    fetchUnifiedTransactionHistory(address, networkIds)
  );

  // Categorize each transaction
  return transactions.map(categorizeTransaction);
};

export const useTransactionHistory = (
  address?: string,
  networkIds?: number[],
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['transactionHistory', address, networkIds],
    queryFn: () => fetchAndCategorizeTransactions(address, networkIds),
    enabled: enabled && !!address && !!networkIds && networkIds.length > 0,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
};

export const useTransactionStatus = (hash?: string, networkId?: number) => {
  return useQuery({
    queryKey: ['transactionStatus', hash, networkId],
    queryFn: async () => {
      if (!hash || !networkId) return null;
      const { getTransactionStatus } = await import('../utils/transactionUtils');
      return getTransactionStatus(hash, networkId);
    },
    enabled: !!hash && !!networkId,
    refetchInterval: (data) => {
      // Stop polling if transaction is confirmed or failed
      if (data === TransactionStatus.CONFIRMED || data === TransactionStatus.FAILED) {
        return false;
      }
      return 10000; // Poll every 10 seconds while pending
    },
  });
};
