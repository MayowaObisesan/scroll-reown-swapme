import { NextRequest, NextResponse } from 'next/server';
import { getAlchemyNetworkForChain } from '../../../utils/networkUtils';
import { getMultipleTokenPrices } from '../../../utils/priceUtils';
import {
  getNativeTokenBalance,
  getERC721Tokens,
  getERC1155Tokens
} from '../../../utils/advancedTokenUtils';
import { TokenBalance, TokenStandard } from '../../../types/token';
import { networks } from '../../../config/wagmi';
import { Alchemy } from 'alchemy-sdk';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const networkId = searchParams.get('networkId');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format
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

    // Fetch balances from all target networks concurrently
    const networkPromises = targetNetworks.map(async (network) => {
      try {
        const allTokens: TokenBalance[] = [];

        // Get native token balance
        const nativeBalance = await getNativeTokenBalance(address, network.id);
        if (nativeBalance) {
          allTokens.push(nativeBalance);
        }

        // Get ERC-20 token balances
        const config = {
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
          network: getAlchemyNetworkForChain(network.id),
        };
        const alchemy = new Alchemy(config);

        const balancesResponse = await alchemy.core.getTokenBalances(address);

        // Remove tokens with zero balance
        const nonZeroBalances = balancesResponse.tokenBalances.filter(
          (token) => token.tokenBalance !== "0"
        );

        // Fetch metadata for each ERC-20 token
        const erc20Balances = await Promise.all(
          nonZeroBalances.map(async (token) => {
            const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
            let balance = Number(token.tokenBalance) / Math.pow(10, metadata.decimals!);
            balance = Number(balance.toFixed(6));

            return {
              id: 0,
              contractAddress: token.contractAddress,
              name: metadata.name || "Unknown Token",
              symbol: metadata.symbol || "UNK",
              balance,
              decimals: metadata.decimals || 18,
              logo: metadata.logo,
              networkId: network.id,
              networkName: network.name,
              usdValue: 0,
              standard: TokenStandard.ERC20,
            } as TokenBalance;
          })
        );

        allTokens.push(...erc20Balances);

        // Get ERC-721 tokens
        const erc721Tokens = await getERC721Tokens(address, network.id);
        allTokens.push(...erc721Tokens);

        // Get ERC-1155 tokens
        const erc1155Tokens = await getERC1155Tokens(address, network.id);
        allTokens.push(...erc1155Tokens);

        return allTokens;
      } catch (networkError) {
        console.warn(`Failed to fetch balances for ${network.name}:`, networkError);
        return [];
      }
    });

    const allNetworkBalances = await Promise.all(networkPromises);
    const flattenedBalances = allNetworkBalances.flat();

    // Get unique symbols for price fetching
    const uniqueSymbols = Array.from(new Set(flattenedBalances.map(b => b.symbol)));

    // Fetch prices for all tokens
    const prices = await getMultipleTokenPrices(uniqueSymbols);

    // Calculate USD values
    const balancesWithPrices = flattenedBalances.map((balance, index) => {
      const price = prices[balance.symbol] || 0;
      const usdValue = balance.balance * price;

      return {
        ...balance,
        id: index + 1,
        usdValue,
      };
    });

    // Calculate portfolio summary
    const totalValue = balancesWithPrices.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    const tokenCount = balancesWithPrices.length;
    const networkBreakdown = balancesWithPrices.reduce((acc, token) => {
      acc[token.networkName] = (acc[token.networkName] || 0) + (token.usdValue || 0);
      return acc;
    }, {} as Record<string, number>);

    const response = {
      address,
      totalValue,
      tokenCount,
      networkBreakdown,
      tokens: balancesWithPrices,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
