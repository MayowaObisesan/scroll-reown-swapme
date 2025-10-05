"use client";

import React, { useEffect, useState } from "react";
import { Alchemy, Network } from "alchemy-sdk";
import { useAccount, useChainId } from "wagmi";
import { getAlchemyNetworkForChain } from "../../utils/networkUtils";
import { TokenBalance } from "../../types/token";
import { TokenBalanceTable } from "./TokenBalanceTable";

/**
 * TokenBalances component displays a table of token balances for the connected wallet
 *
 * @component
 * @example
 * ```tsx
 * <TokenBalances />
 * ```
 */
const TokenBalances = () => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
          network: getAlchemyNetworkForChain(chainId),
        };
        const alchemy = new Alchemy(config);

        // Wallet address
        // const address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

        // Get token balances
        const balancesResponse = await alchemy.core.getTokenBalances(
          address as string
        );

        // Remove tokens with zero balance
        const nonZeroBalances = balancesResponse.tokenBalances.filter(
          (token) => token.tokenBalance !== "0"
        );

        // Fetch metadata for each token
        const enrichedBalances = await Promise.all(
          nonZeroBalances.map(async (token, index) => {
            const metadata = await alchemy.core.getTokenMetadata(
              token.contractAddress
            );
            let balance =
              Number(token?.tokenBalance) / Math.pow(10, metadata.decimals!);
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

        setBalances(enrichedBalances);
        setLoading(false);
      } catch (err) {
        setError((err as unknown as any).message);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchBalances();
    } else {
      setLoading(false);
    }
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
      <TokenBalanceTable
        tokens={balances}
        loading={loading}
        error={error}
      />
      <div aria-live="polite" className="sr-only">
        {loading && "Loading token balances..."}
        {!loading && balances.length > 0 && `Loaded ${balances.length} token balances`}
        {!loading && balances.length === 0 && "No tokens found"}
      </div>
      {/* <h2>Token Balances</h2> */}
      {/* {balances.length === 0 ? (
        <p>No tokens with non-zero balance found.</p>
      ) : (
        <>
          <ul>
            {balances.map((token) => (
              <li key={token?.id}>
                {token?.id}. {token?.name}: {token?.balance} {token?.symbol}
              </li>
            ))}
          </ul>
        </>
      )} */}
    </div>
  );
};

export default TokenBalances;
