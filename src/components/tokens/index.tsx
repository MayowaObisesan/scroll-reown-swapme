"use client";

import React, { useEffect, useState } from "react";
import { Alchemy, Network } from "alchemy-sdk";
import { useAccount } from "wagmi";
import { getAlchemyNetworkForChain } from "../../utils/networkUtils";
import { getMultipleTokenPrices } from "../../utils/priceUtils";
import {
  getNativeTokenBalance,
  getERC721Tokens,
  getERC1155Tokens
} from "../../utils/advancedTokenUtils";
import { TokenBalance, TokenStandard, CustomToken } from "../../types/token";
import { TokenBalanceTable } from "./TokenBalanceTable";
import { CustomTokenImport } from "./CustomTokenImport";
import { MultiChainDashboard } from "../dashboard/MultiChainDashboard";
import { networks } from "../../config/wagmi";

/**
 * TokenBalances component displays a table of token balances for the connected wallet across all supported networks
 *
 * @component
 * @example
 * ```tsx
 * <TokenBalances />
 * ```
 */
const TokenBalances = () => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { address, isConnected } = useAccount();

  const handleCustomTokenAdded = (token: CustomToken) => {
    setCustomTokens(prev => [...prev, token]);
    // Trigger refresh to include the new custom token
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchMultiChainBalances = async () => {
      if (!address || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        // Fetch balances from all networks concurrently
        const networkPromises = networks.map(async (network, networkIndex) => {
          try {
            const allTokens: TokenBalance[] = [];

            // Get native token balance
            const nativeBalance = await getNativeTokenBalance(address as string, network.id);
            if (nativeBalance) {
              allTokens.push(nativeBalance);
            }

            // Get ERC-20 token balances
            const config = {
              apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
              network: getAlchemyNetworkForChain(network.id),
            };
            const alchemy = new Alchemy(config);

            const balancesResponse = await alchemy.core.getTokenBalances(
              address as string
            );

            // Remove tokens with zero balance
            const nonZeroBalances = balancesResponse.tokenBalances.filter(
              (token) => token.tokenBalance !== "0"
            );

            // Fetch metadata for each ERC-20 token
            const erc20Balances = await Promise.all(
              nonZeroBalances.map(async (token) => {
                const metadata = await alchemy.core.getTokenMetadata(
                  token.contractAddress
                );
                let balance =
                  Number(token?.tokenBalance) / Math.pow(10, metadata.decimals!);
                balance = Number(balance.toFixed(6)); // More precision for aggregation

                return {
                  id: 0, // Will be set globally
                  contractAddress: token.contractAddress,
                  name: metadata.name || "Unknown Token",
                  symbol: metadata.symbol || "UNK",
                  balance,
                  decimals: metadata.decimals || 18,
                  logo: metadata.logo,
                  networkId: network.id,
                  networkName: network.name,
                  usdValue: 0, // Will be calculated later
                  standard: TokenStandard.ERC20,
                } as TokenBalance;
              })
            );

            allTokens.push(...erc20Balances);

            // Get ERC-721 tokens
            const erc721Tokens = await getERC721Tokens(address as string, network.id);
            allTokens.push(...erc721Tokens);

            // Get ERC-1155 tokens
            const erc1155Tokens = await getERC1155Tokens(address as string, network.id);
            allTokens.push(...erc1155Tokens);

            return allTokens;
          } catch (networkError) {
            console.warn(`Failed to fetch balances for ${network.name}:`, networkError);
            return []; // Return empty array for failed networks
          }
        });

        const allNetworkBalances = await Promise.all(networkPromises);
        const flattenedBalances = allNetworkBalances.flat();

        // Get unique symbols for price fetching
        const uniqueSymbols = Array.from(new Set(flattenedBalances.map(b => b.symbol)));

        // Fetch prices for all tokens
        const prices = await getMultipleTokenPrices(uniqueSymbols);

        // Calculate USD values and assign global IDs
        const balancesWithPrices = flattenedBalances.map((balance, index) => {
          const price = prices[balance.symbol] || 0;
          const usdValue = balance.balance * price;

          return {
            ...balance,
            id: index + 1,
            usdValue,
          };
        });

        setBalances(balancesWithPrices);
      } catch (err) {
        setError((err as unknown as any).message);
      } finally {
        setLoading(false);
      }
    };

    fetchMultiChainBalances();
  }, [address, isConnected, refreshTrigger]);

  // Background refresh for real-time data
  useEffect(() => {
    if (!address || !isConnected) return;

    const interval = setInterval(() => {
      // Trigger background refresh every 5 minutes
      setRefreshTrigger(prev => prev + 1);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [address, isConnected]);

  //   if (loading)
  //     return (
  //       <div>
  //         <Spinner size="lg" />
  //         Fetching Account Token Details...
  //       </div>
  //     );
  //   if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Token Balances</h2>
        <CustomTokenImport
          onTokenAdded={handleCustomTokenAdded}
          networkId={1} // Default to Ethereum, could be made dynamic
        />
      </div>
      <MultiChainDashboard
        balances={balances}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshTrigger(prev => prev + 1)}
      />
      <div aria-live="polite" className="sr-only">
        {loading && "Loading token balances..."}
        {!loading && balances.length > 0 && `Loaded ${balances.length} token balances`}
        {!loading && balances.length === 0 && "No tokens found"}
      </div>
    </div>
  );
};

export default TokenBalances;
