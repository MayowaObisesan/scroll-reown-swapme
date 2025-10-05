import { Alchemy, Network } from 'alchemy-sdk';
import { getAlchemyNetworkForChain } from './networkUtils';
import { Transaction, TransactionStatus, TransactionType, GasAnalytics } from '../types/token';
import { withRetry } from './retryWrapper';

const getNetworkName = (networkId: number): string => {
  const names: { [key: number]: string } = {
    1: 'Ethereum',
    5: 'Goerli',
    11155111: 'Sepolia',
    8453: 'Base',
    84532: 'Base Sepolia',
    534352: 'Scroll',
    534351: 'Scroll Sepolia',
  };
  return names[networkId] || 'Unknown';
};

export const fetchTransactionHistory = async (
  address: string,
  networkId: number,
  pageKey?: string
): Promise<{ transactions: Transaction[]; pageKey?: string }> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    const response = await alchemy.core.getAssetTransfers({
      fromBlock: '0x0',
      toAddress: address,
      category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
      withMetadata: true,
      maxCount: 100,
      pageKey,
    });

    const transactions: Transaction[] = response.transfers.map((transfer) => {
      const isIncoming = transfer.to?.toLowerCase() === address.toLowerCase();
      const category = isIncoming ? 'receive' : 'send';

      return {
        hash: transfer.hash,
        from: transfer.from || '',
        to: transfer.to || '',
        value: transfer.value?.toString() || '0',
        timestamp: transfer.metadata?.blockTimestamp ? new Date(transfer.metadata.blockTimestamp).getTime() : Date.now(),
        blockNumber: transfer.blockNum ? parseInt(transfer.blockNum, 16) : undefined,
        status: TransactionStatus.CONFIRMED,
        type: TransactionType.TRANSFER,
        networkId,
        networkName: getNetworkName(networkId),
        category,
        tokens: transfer.asset ? {
          from: transfer.asset === 'ETH' ? {
            address: '',
            symbol: 'ETH',
            amount: transfer.value?.toString() || '0',
          } : {
            address: transfer.contractAddress || '',
            symbol: transfer.asset,
            amount: transfer.value?.toString() || '0',
          }
        } : undefined,
      };
    });

    return {
      transactions,
      pageKey: response.pageKey,
    };
  } catch (error) {
    console.warn(`Failed to fetch transaction history for network ${networkId}:`, error);
    return { transactions: [] };
  }
};

export const fetchUnifiedTransactionHistory = async (
  address: string,
  networkIds: number[]
): Promise<Transaction[]> => {
  const allTransactions: Transaction[] = [];

  for (const networkId of networkIds) {
    try {
      const { transactions } = await withRetry(() => fetchTransactionHistory(address, networkId));
      allTransactions.push(...transactions);
    } catch (error) {
      console.warn(`Failed to fetch transactions for network ${networkId}:`, error);
    }
  }

  // Sort by timestamp descending
  return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
};

export const categorizeTransaction = (transaction: Transaction): Transaction => {
  const { type, to, from, tokens } = transaction;

  // Basic categorization based on transaction type and addresses
  if (type === TransactionType.SWAP) {
    transaction.category = 'swap';
  } else if (type === TransactionType.STAKE) {
    transaction.category = 'stake';
  } else if (type === TransactionType.BRIDGE) {
    transaction.category = 'bridge';
  } else if (tokens?.from && tokens?.to) {
    transaction.category = 'swap';
  } else {
    // Check for common DeFi contract interactions
    const defiContracts = [
      // Add known DeFi contract addresses here
    ];

    if (defiContracts.includes(to.toLowerCase())) {
      transaction.category = 'yield';
    } else {
      transaction.category = 'other';
    }
  }

  return transaction;
};

export const getTransactionStatus = async (
  hash: string,
  networkId: number
): Promise<TransactionStatus> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    const receipt = await alchemy.core.getTransactionReceipt(hash);

    if (!receipt) {
      return TransactionStatus.PENDING;
    }

    return receipt.status === 1 ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED;
  } catch (error) {
    console.warn(`Failed to get transaction status for ${hash}:`, error);
    return TransactionStatus.PENDING;
  }
};

export const calculateGasAnalytics = async (
  address: string,
  networkId: number
): Promise<GasAnalytics> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    // Get recent transactions for gas analysis
    const { transactions } = await fetchTransactionHistory(address, networkId);
    const recentTransactions = transactions.slice(0, 50); // Last 50 transactions

    if (recentTransactions.length === 0) {
      return {
        networkId,
        averageGasPrice: '0',
        medianGasPrice: '0',
        suggestedGasPrice: '20000000000', // 20 gwei default
        gasUsed: '21000',
        efficiency: 'medium',
        recommendations: ['Use default gas settings for this network'],
      };
    }

    const gasPrices = recentTransactions
      .filter(tx => tx.gasPrice)
      .map(tx => parseFloat(tx.gasPrice!));

    const averageGasPrice = gasPrices.length > 0
      ? (gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length).toString()
      : '20000000000';

    const sortedPrices = gasPrices.sort((a, b) => a - b);
    const medianGasPrice = sortedPrices.length > 0
      ? sortedPrices[Math.floor(sortedPrices.length / 2)].toString()
      : averageGasPrice;

    const gasUsed = recentTransactions
      .filter(tx => tx.gasUsed)
      .map(tx => parseFloat(tx.gasUsed!));

    const averageGasUsed = gasUsed.length > 0
      ? (gasUsed.reduce((a, b) => a + b, 0) / gasUsed.length).toString()
      : '21000';

    // Calculate efficiency based on gas usage vs limit
    const efficiency = parseFloat(averageGasUsed) < 50000 ? 'high' :
                      parseFloat(averageGasUsed) < 150000 ? 'medium' : 'low';

    const recommendations = [];
    if (efficiency === 'low') {
      recommendations.push('Consider optimizing contract calls to reduce gas usage');
    }
    if (gasPrices.length > 0 && parseFloat(medianGasPrice) > 50000000000) { // > 50 gwei
      recommendations.push('Network gas prices are high, consider transacting during off-peak hours');
    }

    return {
      networkId,
      averageGasPrice,
      medianGasPrice,
      suggestedGasPrice: medianGasPrice,
      gasUsed: averageGasUsed,
      efficiency,
      recommendations,
    };
  } catch (error) {
    console.warn(`Failed to calculate gas analytics for network ${networkId}:`, error);
    return {
      networkId,
      averageGasPrice: '0',
      medianGasPrice: '0',
      suggestedGasPrice: '20000000000',
      gasUsed: '21000',
      efficiency: 'medium',
      recommendations: ['Unable to analyze gas usage at this time'],
    };
  }
};
