import { useQuery } from '@tanstack/react-query';
import { Alchemy, Network } from 'alchemy-sdk';
import { getAlchemyNetworkForChain } from '../utils/networkUtils';
import { TokenBalance } from '../types/token';
import { withRetry } from '../utils/retryWrapper';
import { useChainId } from 'wagmi';

const fetchTokenBalances = async (address?: string, chainId?: number): Promise<TokenBalance[]> => {
  if (!address || !chainId) return [];

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
    network: getAlchemyNetworkForChain(chainId),
  };
  const alchemy = new Alchemy(config);

  const balancesResponse = await alchemy.core.getTokenBalances(address);
  const nonZeroBalances = balancesResponse.tokenBalances.filter(
    (token) => token.tokenBalance !== "0"
  );

  const enrichedBalances = await Promise.all(
    nonZeroBalances.map(async (token, index) => {
      const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
      let balance = Number(token.tokenBalance) / Math.pow(10, metadata.decimals!);
      balance = Number(balance.toFixed(2));
      return {
        id: index + 1,
        contractAddress: token.contractAddress,
        name: metadata.name,
        symbol: metadata.symbol,
        balance,
        decimals: metadata.decimals,
        logo: metadata.logo,
      };
    })
  );

  return enrichedBalances;
};

export const useTokenBalances = (address?: string) => {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['tokenBalances', address, chainId],
    queryFn: () => withRetry(() => fetchTokenBalances(address, chainId)),
    enabled: !!address && !!chainId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};
