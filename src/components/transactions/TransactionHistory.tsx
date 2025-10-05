'use client';

import React, { useState } from 'react';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { useAccount } from 'wagmi';
import { Transaction, TransactionStatus } from '../../types/token';
import { formatDistanceToNow } from 'date-fns';

interface TransactionHistoryProps {
  networkIds?: number[];
  limit?: number;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  networkIds = [1, 8453, 534352], // Default to Ethereum, Base, Scroll
  limit = 50
}) => {
  const { address } = useAccount();
  const { data: transactions, isLoading, error } = useTransactionHistory(address, networkIds);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions?.filter(tx => {
    const matchesFilter = filter === 'all' || tx.category === filter;
    const matchesSearch = searchTerm === '' ||
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  }).slice(0, limit) || [];

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return 'text-green-600 bg-green-100';
      case TransactionStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case TransactionStatus.FAILED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'send':
        return '📤';
      case 'receive':
        return '📥';
      case 'swap':
        return '🔄';
      case 'stake':
        return '🔒';
      case 'bridge':
        return '🌉';
      case 'yield':
        return '💰';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <div className="text-red-600">Failed to load transaction history</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="send">Sent</option>
          <option value="receive">Received</option>
          <option value="swap">Swaps</option>
          <option value="stake">Staking</option>
          <option value="bridge">Bridges</option>
          <option value="yield">Yield</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.hash} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCategoryIcon(tx.category)}</span>
                  <div>
                    <div className="font-medium">
                      {tx.description || `${tx.category.charAt(0).toUpperCase() + tx.category.slice(1)} Transaction`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {tx.networkName}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="font-mono text-xs text-gray-600">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </div>
                {tx.fee && (
                  <div className="text-gray-600">
                    Fee: {parseFloat(tx.fee.amount).toFixed(6)} {tx.fee.symbol}
                  </div>
                )}
              </div>

              {tx.tokens && (
                <div className="mt-2 text-sm">
                  {tx.tokens.from && (
                    <span className="text-red-600">
                      -{tx.tokens.from.amount} {tx.tokens.from.symbol}
                    </span>
                  )}
                  {tx.tokens.to && (
                    <span className="text-green-600 ml-2">
                      +{tx.tokens.to.amount} {tx.tokens.to.symbol}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {transactions && transactions.length > limit && (
        <div className="text-center mt-6">
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Load More Transactions
          </button>
        </div>
      )}
    </div>
  );
};
