"use client";

import React, { useEffect, useState } from "react";
import { Alchemy, Network } from "alchemy-sdk";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/table";
import { Spinner } from "@nextui-org/spinner";
import { useAccount } from "wagmi";

const columns = [
  {
    key: "id",
    label: "ID",
  },
  {
    key: "name",
    label: "NAME",
  },
  {
    key: "balance",
    label: "BALANCE",
  },
  {
    key: "symbol",
    label: "SYMBOL",
  },
];

const TokenBalances = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
          network: Network.ETH_MAINNET,
        };
        const alchemy = new Alchemy(config);

        // Wallet address
        // const address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

        // Get token balances
        const balancesResponse = await alchemy.core.getTokenBalances(address);

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
            let balance = token.tokenBalance / Math.pow(10, metadata.decimals);
            balance = balance.toFixed(2);
            return {
              id: index + 1,
              name: metadata.name,
              symbol: metadata.symbol,
              balance,
            };
          })
        );

        setBalances(enrichedBalances);
        setLoading(false);
      } catch (err) {
        setError(err.message);
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
      <Table aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={balances}
          isLoading={loading}
          loadingContent={<Spinner label="Loading..." />}
          emptyContent={"No tokens to display."}
        >
          {(item) => (
            <TableRow key={balances.id}>
              {(columnKey) => (
                <TableCell>{getKeyValue(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
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
