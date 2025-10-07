"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { RefreshCw, TrendingUp, DollarSign, Percent, AlertTriangle, Filter } from "lucide-react";
import { useAccount } from "wagmi";
import { DeFiService, DeFiPosition } from "../../utils/defiUtils";
import { getNetworkConfig } from "../../utils/networkUtils";

interface DeFiPositionsProps {
  onRefresh?: () => void;
}

export const DeFiPositions: React.FC<DeFiPositionsProps> = ({ onRefresh }) => {
  const { address } = useAccount();
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingPosition, setWithdrawingPosition] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const fetchPositions = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/defi?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch DeFi positions');
      }
      const data = await response.json();
      setPositions(data.positions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DeFi positions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchPositions();
    }
  }, [address]);

  const getPositionIcon = (type: string) => {
    switch (type) {
      case 'liquidity':
        return <DollarSign className="w-4 h-4" />;
      case 'lending':
        return <TrendingUp className="w-4 h-4" />;
      case 'staking':
        return <Percent className="w-4 h-4" />;
      case 'farming':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors: { [key: string]: string } = {
      'Uniswap V3': 'primary',
      'Aave': 'secondary',
      'Compound': 'success',
      'Curve': 'warning',
      'Aerodrome': 'primary',
      'Scroll Ecosystem': 'success'
    };
    return colors[protocol] || 'default';
  };

  // Filter options
  const networkOptions = useMemo(() => {
    const networks = new Set(positions.map(pos => pos.networkId));
    return Array.from(networks).map(networkId => ({
      key: networkId.toString(),
      label: getNetworkConfig(networkId).name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [positions]);

  const typeOptions = useMemo(() => {
    const types = new Set(positions.map(pos => pos.type));
    return Array.from(types).map(type => ({
      key: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [positions]);

  // Filtered positions
  const filteredPositions = useMemo(() => {
    return positions.filter(position => {
      const networkMatch = selectedNetwork === "all" || position.networkId.toString() === selectedNetwork;
      const typeMatch = selectedType === "all" || position.type === selectedType;
      return networkMatch && typeMatch;
    });
  }, [positions, selectedNetwork, selectedType]);

  const totalValue = filteredPositions.reduce((sum, pos) => sum + parseFloat(pos.value || '0'), 0);
  const totalAPR = filteredPositions.length > 0
    ? filteredPositions.reduce((sum, pos) => sum + parseFloat(pos.apr || '0'), 0) / filteredPositions.length
    : 0;

  const handleEmergencyWithdraw = async (position: DeFiPosition) => {
    if (!address) return;

    const positionId = `${position.protocol}-${position.type}-${position.networkId}`;
    setWithdrawingPosition(positionId);

    try {
      const result = await DeFiService.emergencyWithdraw(position, address);
      if (result.success) {
        alert(`Emergency withdrawal successful! Transaction: ${result.txHash}`);
        // Refresh positions after withdrawal
        await fetchPositions();
      } else {
        alert(`Emergency withdrawal failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Emergency withdrawal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setWithdrawingPosition(null);
    }
  };

  if (!address) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-gray-500">Connect your wallet to view DeFi positions</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">DeFi Positions</h3>
          <Button
            isIconOnly
            variant="light"
            onClick={fetchPositions}
            disabled={loading}
            aria-label="Refresh DeFi positions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            placeholder="All Networks"
            selectedKeys={[selectedNetwork]}
            onSelectionChange={(keys) => setSelectedNetwork(Array.from(keys)[0] as string)}
            className="w-40"
            size="sm"
            variant="bordered"
          >
            <SelectItem key="all">All Networks</SelectItem>
            <>
              {networkOptions.map((network) => (
                <SelectItem key={network.key}>
                  {network.label}
                </SelectItem>
              ))}
            </>
          </Select>
          <Select
            placeholder="All Types"
            selectedKeys={[selectedType]}
            onSelectionChange={(keys) => setSelectedType(Array.from(keys)[0] as string)}
            className="w-40"
            size="sm"
            variant="bordered"
          >
            <SelectItem key="all">All Types</SelectItem>
            <>
              {typeOptions.map((type) => (
                <SelectItem key={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </>
          </Select>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex justify-center">
            <Spinner label="Loading DeFi positions..." />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button
              variant="light"
              onClick={fetchPositions}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : filteredPositions.length === 0 ? (
          <p className="text-center text-gray-500">
            {positions.length === 0 ? "No DeFi positions found" : "No positions match the selected filters"}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardBody>
                  <p className="text-sm text-gray-600">
                    {selectedNetwork === "all" && selectedType === "all"
                      ? "Total DeFi Value"
                      : "Filtered DeFi Value"}
                  </p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-gray-600">
                    {selectedNetwork === "all" && selectedType === "all"
                      ? "Average APR"
                      : "Filtered Average APR"}
                  </p>
                  <p className="text-2xl font-bold">{totalAPR.toFixed(2)}%</p>
                </CardBody>
              </Card>
            </div>

            {/* Positions List */}
            <div className="space-y-3">
              {filteredPositions.map((position, index) => (
                <Card key={index}>
                  <CardBody>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPositionIcon(position.type)}
                        <Chip
                          color={getProtocolColor(position.protocol) as any}
                          variant="flat"
                          size="sm"
                        >
                          {position.protocol}
                        </Chip>
                        <Chip
                          color="default"
                          variant="bordered"
                          size="sm"
                        >
                          {position.type}
                        </Chip>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${parseFloat(position.value || '0').toLocaleString()}</p>
                        <p className="text-sm text-green-600">{position.apr}% APR</p>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          startContent={<AlertTriangle className="w-3 h-3" />}
                          onClick={() => handleEmergencyWithdraw(position)}
                          isLoading={withdrawingPosition === `${position.protocol}-${position.type}-${position.networkId}`}
                          disabled={withdrawingPosition !== null}
                          className="mt-1"
                        >
                          Emergency Withdraw
                        </Button>
                      </div>
                    </div>

                    {/* Position Details */}
                    <div className="text-sm text-gray-600">
                      {position.details && (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(position.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
