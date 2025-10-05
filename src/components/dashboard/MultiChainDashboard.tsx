"use client";

import React, { useMemo, useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";
import { RefreshCw } from "lucide-react";
import { TokenBalance } from "../../types/token";
import { TokenBalanceTable } from "../tokens/TokenBalanceTable";
import { getMultipleNetworkHealth, NetworkHealth } from "../../utils/networkHealthUtils";
import { networks } from "../../config/wagmi";
import { DeFiPositions } from "../defi";

interface MultiChainDashboardProps {
  balances: TokenBalance[];
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}

interface NetworkSummary {
  networkId: number;
  networkName: string;
  totalTokens: number;
  totalValue: number;
  tokens: TokenBalance[];
  error?: string;
}

export const MultiChainDashboard: React.FC<MultiChainDashboardProps> = ({
  balances,
  loading,
  error,
  onRefresh,
}) => {
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    const fetchNetworkHealth = async () => {
      if (loading) return; // Don't fetch health while balances are loading

      setHealthLoading(true);
      try {
        const healthData = await getMultipleNetworkHealth(
          networks.map(n => ({ id: n.id, name: n.name })),
          process.env.NEXT_PUBLIC_ALCHEMY_KEY
        );
        setNetworkHealth(healthData);
      } catch (error) {
        console.warn('Failed to fetch network health:', error);
      } finally {
        setHealthLoading(false);
      }
    };

    fetchNetworkHealth();
  }, [loading]);

  const portfolioSummary = useMemo(() => {
    const networkSummaries: { [key: number]: NetworkSummary } = {};
    const networkErrors: { [key: number]: string } = {};

    // Track which networks have balances
    balances.forEach((balance) => {
      if (!networkSummaries[balance.networkId]) {
        networkSummaries[balance.networkId] = {
          networkId: balance.networkId,
          networkName: balance.networkName,
          totalTokens: 0,
          totalValue: 0,
          tokens: [],
        };
      }

      networkSummaries[balance.networkId].totalTokens += 1;
      networkSummaries[balance.networkId].totalValue += balance.usdValue || 0;
      networkSummaries[balance.networkId].tokens.push(balance);
    });

    // Check for networks with errors from health data
    networkHealth.forEach((health) => {
      if (health.error && !networkSummaries[health.networkId]) {
        networkErrors[health.networkId] = health.error;
      }
    });

    const summaries = Object.values(networkSummaries);
    const totalPortfolioValue = summaries.reduce((sum, network) => sum + network.totalValue, 0);

    return {
      networks: summaries,
      networkErrors,
      totalValue: totalPortfolioValue,
      totalTokens: balances.length,
    };
  }, [balances, networkHealth]);

  const getNetworkColor = (networkName: string) => {
    const colors: { [key: string]: string } = {
      Ethereum: "primary",
      Base: "secondary",
      Scroll: "success",
      "Scroll Sepolia": "warning",
      "Base Sepolia": "warning",
      Sepolia: "warning",
      Goerli: "warning",
    };
    return colors[networkName] || "default";
  };

  const networkRecommendations = useMemo(() => {
    if (networkHealth.length === 0) return null;

    const healthyNetworks = networkHealth.filter(h => !h.error && h.gasPrice);
    if (healthyNetworks.length === 0) return null;

    const sortedByGas = healthyNetworks.sort((a, b) =>
      parseInt(a.gasPrice || '0') - parseInt(b.gasPrice || '0')
    );

    const cheapest = sortedByGas[0];
    const currentExpensive = networkHealth.find(h =>
      h.congestion === 'high' || (h.gasPrice && parseInt(h.gasPrice) / 1e9 > 50)
    );

    if (currentExpensive && cheapest.networkId !== currentExpensive.networkId) {
      return {
        message: `Consider switching to ${cheapest.networkName} for lower gas fees`,
        recommendedNetwork: cheapest.networkName,
        savings: currentExpensive.gasPrice ?
          ((parseInt(currentExpensive.gasPrice) - parseInt(cheapest.gasPrice)) / 1e9).toFixed(2) : '0'
      };
    }

    return null;
  }, [networkHealth]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardBody>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          </CardBody>
        </Card>
        <TokenBalanceTable tokens={[]} loading={true} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center text-red-500">
            <p>Error loading portfolio: {error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <Button
            isIconOnly
            variant="light"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh portfolio data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-3xl font-bold">
                ${portfolioSummary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tokens</p>
              <p className="text-3xl font-bold">{portfolioSummary.totalTokens}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Networks</p>
              <p className="text-3xl font-bold">{portfolioSummary.networks.length}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Network Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Network Breakdown</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {portfolioSummary.networks.map((network) => {
              const percentage = portfolioSummary.totalValue > 0
                ? (network.totalValue / portfolioSummary.totalValue) * 100
                : 0;

              return (
                <div key={network.networkId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Chip
                        color={getNetworkColor(network.networkName) as any}
                        variant="flat"
                        size="sm"
                      >
                        {network.networkName}
                      </Chip>
                      <span className="text-sm text-gray-600">
                        {network.totalTokens} tokens
                      </span>
                    </div>
                    <span className="font-semibold">
                      ${network.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    color={getNetworkColor(network.networkName) as any}
                    size="sm"
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Network Health */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Network Health</h3>
        </CardHeader>
        <CardBody>
          {healthLoading ? (
            <div className="flex justify-center">
              <Spinner label="Loading network health..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {networkHealth.map((health) => (
                <div key={health.networkId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Chip
                      color={getNetworkColor(health.networkName) as any}
                      variant="flat"
                      size="sm"
                    >
                      {health.networkName}
                    </Chip>
                    {health.congestion && (
                      <Chip
                        color={
                          health.congestion === 'low' ? 'success' :
                          health.congestion === 'medium' ? 'warning' : 'danger'
                        }
                        variant="dot"
                        size="sm"
                      >
                        {health.congestion.toUpperCase()}
                      </Chip>
                    )}
                  </div>
                  {health.error ? (
                    <p className="text-sm text-red-500">{health.error}</p>
                  ) : (
                    <div className="space-y-1">
                      {health.gasPrice && (
                        <p className="text-sm">
                          Gas: {(parseInt(health.gasPrice) / 1e9).toFixed(2)} Gwei
                        </p>
                      )}
                      {health.lastBlock && (
                        <p className="text-sm text-gray-600">
                          Block: {health.lastBlock.toLocaleString()}
                        </p>
                      )}
                      {health.connectionQuality && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">Connection:</span>
                          <Chip
                            color={
                              health.connectionQuality === 'excellent' ? 'success' :
                              health.connectionQuality === 'good' ? 'primary' :
                              health.connectionQuality === 'poor' ? 'warning' : 'danger'
                            }
                            variant="dot"
                            size="sm"
                          >
                            {health.connectionQuality.toUpperCase()}
                          </Chip>
                          {health.responseTime && (
                            <span className="text-xs text-gray-500">({health.responseTime}ms)</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Network Recommendations */}
      {networkRecommendations && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Network Recommendations</h3>
          </CardHeader>
          <CardBody>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 font-medium">💡 Suggestion:</span>
                <Chip color="primary" variant="flat" size="sm">
                  {networkRecommendations.recommendedNetwork}
                </Chip>
              </div>
              <p className="text-sm text-blue-800">{networkRecommendations.message}</p>
              {networkRecommendations.savings !== '0' && (
                <p className="text-sm text-blue-600 mt-1">
                  Potential savings: ~{networkRecommendations.savings} Gwei per transaction
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* DeFi Positions */}
      <DeFiPositions onRefresh={onRefresh} />

      {/* Network Errors */}
      {Object.keys(portfolioSummary.networkErrors).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-red-600">Network Issues</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {Object.entries(portfolioSummary.networkErrors).map(([networkId, error]) => {
                const network = networkHealth.find(h => h.networkId === parseInt(networkId));
                return (
                  <div key={networkId} className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-800">
                        {network?.networkName || `Network ${networkId}`}
                      </span>
                      <Chip color="danger" variant="flat" size="sm">
                        Error
                      </Chip>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Token Balances Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">All Token Balances</h3>
        </CardHeader>
        <CardBody>
          <TokenBalanceTable
            tokens={balances}
            loading={false}
            error={error}
            onRefresh={onRefresh}
          />
        </CardBody>
      </Card>
    </div>
  );
};
