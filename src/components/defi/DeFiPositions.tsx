"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";
import { RefreshCw, TrendingUp, DollarSign, Percent, AlertTriangle } from "lucide-react";
import { useAccount } from "wagmi";
import { DeFiService, DeFiPosition } from "../../utils/defiUtils";

interface DeFiPositionsProps {
  onRefresh?: () => void;
}

export const DeFiPositions: React.FC<DeFiPositionsProps> = ({ onRefresh }) => {
  const { address } = useAccount();
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingPosition, setWithdrawingPosition] = useState<string | null>(null);

  const fetchPositions = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const defiPositions = await DeFiService.getAllPositions(address);
      setPositions(defiPositions);
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

  const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.value || '0'), 0);
  const totalAPR = positions.length > 0
    ? positions.reduce((sum, pos) => sum + parseFloat(pos.apr || '0'), 0) / positions.length
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
      <CardHeader className="flex justify-between items-center">
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
        ) : positions.length === 0 ? (
          <p className="text-center text-gray-500">No DeFi positions found</p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total DeFi Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Average APR</p>
                <p className="text-2xl font-bold">{totalAPR.toFixed(2)}%</p>
              </div>
            </div>

            {/* Positions List */}
            <div className="space-y-3">
              {positions.map((position, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
