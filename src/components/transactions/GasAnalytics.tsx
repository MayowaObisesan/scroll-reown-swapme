'use client';

import React from 'react';
import { useGasAnalytics, useMultiChainGasAnalytics } from '../../hooks/useGasAnalytics';
import { useAccount, useChainId } from 'wagmi';

export const GasAnalytics: React.FC = () => {
  const { address } = useAccount();
  const currentChainId = useChainId();

  const { data: currentNetworkAnalytics, isLoading: currentLoading } = useGasAnalytics(
    address,
    currentChainId
  );

  const { data: multiChainAnalytics, isLoading: multiLoading } = useMultiChainGasAnalytics(
    address,
    [1, 8453, 534352] // Ethereum, Base, Scroll
  );

  const formatGasPrice = (price: string) => {
    const gwei = parseFloat(price) / 1e9;
    return `${gwei.toFixed(2)} gwei`;
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (currentLoading || multiLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Gas Analytics</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Gas Analytics & Optimization</h2>

      {/* Current Network Analytics */}
      {currentNetworkAnalytics && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">Current Network</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-blue-700">Average Gas Price</div>
              <div className="font-semibold text-blue-900">
                {formatGasPrice(currentNetworkAnalytics.averageGasPrice)}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Suggested Price</div>
              <div className="font-semibold text-blue-900">
                {formatGasPrice(currentNetworkAnalytics.suggestedGasPrice)}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Avg Gas Used</div>
              <div className="font-semibold text-blue-900">
                {parseFloat(currentNetworkAnalytics.gasUsed).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Efficiency</div>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyColor(currentNetworkAnalytics.efficiency)}`}>
                {currentNetworkAnalytics.efficiency}
              </div>
            </div>
          </div>

          {currentNetworkAnalytics.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {currentNetworkAnalytics.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Multi-Chain Comparison */}
      {multiChainAnalytics && multiChainAnalytics.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Network Comparison</h3>
          <div className="space-y-3">
            {multiChainAnalytics.map((analytics) => (
              <div key={analytics.networkId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="font-medium">
                    {analytics.networkId === 1 && 'Ethereum'}
                    {analytics.networkId === 8453 && 'Base'}
                    {analytics.networkId === 534352 && 'Scroll'}
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyColor(analytics.efficiency)}`}>
                    {analytics.efficiency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Avg Gas Price</div>
                  <div className="font-semibold">
                    {formatGasPrice(analytics.averageGasPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Tips */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Gas Optimization Tips:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Execute transactions during off-peak hours for lower gas prices</li>
          <li>• Batch multiple operations when possible to reduce total gas costs</li>
          <li>• Use gas estimation tools before confirming transactions</li>
          <li>• Consider layer 2 networks for cheaper and faster transactions</li>
        </ul>
      </div>
    </div>
  );
};
