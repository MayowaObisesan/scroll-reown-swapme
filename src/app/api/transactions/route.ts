import { NextRequest, NextResponse } from 'next/server';
import { getAlchemyNetworkForChain } from '../../../utils/networkUtils';
import { networks } from '../../../config/wagmi';
import { Alchemy, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { Transaction, TransactionStatus, TransactionType } from '../../../types/token';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const networkId = searchParams.get('networkId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const targetNetworks = networkId
      ? networks.filter(n => n.id === parseInt(networkId))
      : networks;

    if (targetNetworks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid network ID' },
        { status: 400 }
      );
    }

    // Fetch transactions from all target networks
    const transactionPromises = targetNetworks.map(async (network) => {
      try {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
          network: getAlchemyNetworkForChain(network.id),
        };
        const alchemy = new Alchemy(config);

        const transactions = await alchemy.core.getAssetTransfers({
          fromBlock: '0x0',
          toAddress: address,
          category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.INTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
          maxCount: Math.min(limit, 100), // Alchemy limit
          order: SortingOrder.DESCENDING,
        });

        return transactions.transfers.map((tx): Transaction => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '',
          value: tx.value?.toString() || '0',
          timestamp: Date.now(), // Use current timestamp as fallback since Alchemy API structure changed
          status: TransactionStatus.CONFIRMED,
          type: getTransactionType(tx.category),
          networkId: network.id,
          networkName: network.name,
          gasUsed: undefined, // Not available in current Alchemy API structure
          gasPrice: undefined, // Not available in current Alchemy API structure
          blockNumber: tx.blockNum ? parseInt(tx.blockNum.toString()) : undefined,
          category: tx.to?.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
        }));
      } catch (networkError) {
        console.warn(`Failed to fetch transactions for ${network.name}:`, networkError);
        return [];
      }
    });

    const allNetworkTransactions = await Promise.all(transactionPromises);
    const flattenedTransactions = allNetworkTransactions.flat();

    // Sort by timestamp (most recent first) and apply pagination
    const sortedTransactions = flattenedTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);

    const response = {
      address,
      transactions: sortedTransactions,
      total: flattenedTransactions.length,
      limit,
      offset,
      hasMore: flattenedTransactions.length > offset + limit,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTransactionType(category: string): TransactionType {
  switch (category) {
    case 'external':
      return TransactionType.TRANSFER;
    case 'internal':
      return TransactionType.CONTRACT_INTERACTION;
    case 'erc20':
      return TransactionType.TRANSFER;
    case 'erc721':
    case 'erc1155':
      return TransactionType.TRANSFER;
    default:
      return TransactionType.CONTRACT_INTERACTION;
  }
}
