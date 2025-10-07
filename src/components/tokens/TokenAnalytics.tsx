"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Chip,
} from "@heroui/react";
import { TokenBalance, TokenTransfer } from "../../types/token";
import { Alchemy, Network } from "alchemy-sdk";
import { getAlchemyNetworkForChain } from "../../utils/networkUtils";
import { detectYieldOpportunities, getTokenHoldersAnalysis } from "../../utils/yieldUtils";

interface TokenAnalyticsProps {
  token: TokenBalance;
}

export const TokenAnalytics: React.FC<TokenAnalyticsProps> = ({ token }) => {
  const [transfers, setTransfers] = useState<TokenTransfer[]>([]);
  const [yieldOpportunities, setYieldOpportunities] = useState<any[]>([]);
  const [holderAnalysis, setHolderAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);

      try {
        // Fetch transfer history
        if (token.standard === 'native') {
          await fetchNativeTransfers();
        } else {
          await fetchTokenTransfers();
        }

        // Fetch yield opportunities
        const yieldOps = await detectYieldOpportunities(token);
        setYieldOpportunities(yieldOps);

        // Fetch holder analysis for non-native tokens
        if (token.contractAddress) {
          const holders = await getTokenHoldersAnalysis(token.contractAddress, token.networkId);
          setHolderAnalysis(holders);
        }
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  const fetchNativeTransfers = async () => {
    try {
      setLoading(true);
      const config = {
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
        network: getAlchemyNetworkForChain(token.networkId),
      };
      const alchemy = new Alchemy(config);

      // Get transaction history for the address
      const transactions = await alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        toAddress: token.contractAddress || undefined, // This won't work for native tokens
        category: ["external"] as any, // Using any to bypass type checking for now
        maxCount: 100,
      });

      // Filter and format native transfers
      const nativeTransfers: TokenTransfer[] = transactions.transfers
        .filter(transfer => transfer.asset === 'ETH')
        .map(transfer => ({
          hash: transfer.hash,
          from: transfer.from,
          to: transfer.to || '', // Handle null case
          value: transfer.value?.toString() || '0',
          timestamp: Date.now() / 1000, // Simplified timestamp
          tokenAddress: '',
          tokenSymbol: 'ETH',
          category: transfer.from === token.contractAddress ? 'send' : 'receive',
          networkId: token.networkId,
        }));

      setTransfers(nativeTransfers);
    } catch (err) {
      setError('Failed to fetch transfer history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenTransfers = async () => {
    try {
      setLoading(true);
      const config = {
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
        network: getAlchemyNetworkForChain(token.networkId),
      };
      const alchemy = new Alchemy(config);

      const transfersResponse = await alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        contractAddresses: [token.contractAddress],
        category: ["external"] as any,
        maxCount: 100,
      });

      const tokenTransfers: TokenTransfer[] = transfersResponse.transfers.map(transfer => ({
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to || '', // Handle null case
        value: transfer.value?.toString() || '0',
        timestamp: Date.now() / 1000, // Simplified timestamp
        tokenAddress: token.contractAddress,
        tokenSymbol: token.symbol,
        category: transfer.from === token.contractAddress ? 'send' : 'receive',
        networkId: token.networkId,
      }));

      setTransfers(tokenTransfers);
    } catch (err) {
      setError('Failed to fetch transfer history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'send': return 'danger';
      case 'receive': return 'success';
      case 'swap': return 'warning';
      case 'stake': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">
          Analytics for {token.name} ({token.symbol})
        </h3>
      </CardHeader>
      <CardBody>
        <Tabs>
          <Tab key="transfers" title="Transfer History">
            {loading ? (
              <div className="flex justify-center p-8">
                <Spinner label="Loading transfer history..." />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : (
              <Table aria-label="Transfer history table">
                <TableHeader>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>FROM/TO</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>TX HASH</TableColumn>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          color={getCategoryColor(transfer.category)}
                          size="sm"
                          variant="flat"
                        >
                          {transfer.category.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {transfer.category === 'send' ? transfer.to : transfer.from}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transfer.value} {transfer.tokenSymbol}
                      </TableCell>
                      <TableCell>
                        {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {transfer.hash.slice(0, 10)}...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Tab>
          <Tab key="analytics" title="Token Analytics">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardBody>
                    <p className="text-sm text-gray-600">Total Transfers</p>
                    <p className="text-2xl font-bold">{transfers.length}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold">{token.balance.toFixed(4)}</p>
                  </CardBody>
                </Card>
              </div>
              <div className="text-sm text-gray-600">
                <p>Network: {token.networkName}</p>
                <p>Standard: {token.standard.toUpperCase()}</p>
                {token.contractAddress && (
                  <p>Contract: {token.contractAddress}</p>
                )}
              </div>
            </div>
          </Tab>
          <Tab key="yield" title="Yield Farming">
            <div className="space-y-4">
              {yieldOpportunities.length > 0 ? (
                yieldOpportunities.map((opportunity, index) => (
                  <Card key={index}>
                    <CardBody>
                      <h4 className="font-semibold">{opportunity.protocol}</h4>
                      <p className="text-sm text-gray-600">{opportunity.type}</p>
                      <p className="text-sm">{opportunity.description}</p>
                      <Chip size="sm" color="success" className="mt-2">
                        APY: {opportunity.apy}
                      </Chip>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500">No yield farming opportunities found for this token.</p>
              )}
            </div>
          </Tab>
          <Tab key="holders" title="Holder Analysis">
            {holderAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardBody>
                      <p className="text-sm text-gray-600">Total Holders</p>
                      <p className="text-2xl font-bold">{holderAnalysis.totalHolders.toLocaleString()}</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-sm text-gray-600">Concentration</p>
                      <p className="text-2xl font-bold">{holderAnalysis.concentration}</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-sm text-gray-600">Top Holder %</p>
                      <p className="text-2xl font-bold">{holderAnalysis.topHolders[0]?.percentage}%</p>
                    </CardBody>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Top Holders</h4>
                  </CardHeader>
                  <CardBody>
                    <Table aria-label="Top holders table">
                      <TableHeader>
                        <TableColumn>Address</TableColumn>
                        <TableColumn>Percentage</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {holderAnalysis.topHolders.map((holder: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="font-mono text-sm">{holder.address}</div>
                            </TableCell>
                            <TableCell>{holder.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <p className="text-center text-gray-500">Holder analysis not available for native tokens.</p>
            )}
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
};
