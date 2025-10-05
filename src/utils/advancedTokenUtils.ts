import { Alchemy, Network } from 'alchemy-sdk';
import { getAlchemyNetworkForChain } from './networkUtils';
import { TokenBalance, TokenStandard, TokenMetadata, CustomToken } from '../types/token';
import { getPublicClient } from '@wagmi/core';
import { wagmiAdapter } from '../config/wagmi';
import { formatEther } from 'viem';

// Native token configurations
const NATIVE_TOKENS = {
  1: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  5: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  11155111: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  8453: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }, // Base uses ETH
  84532: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  534352: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }, // Scroll uses ETH
  534351: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
};

export const getNativeTokenBalance = async (
  address: string,
  networkId: number
): Promise<TokenBalance | null> => {
  try {
    const publicClient = getPublicClient(wagmiAdapter.wagmiConfig, { chainId: networkId });
    if (!publicClient) return null;

    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    const balanceInEth = parseFloat(formatEther(balance));

    const nativeToken = NATIVE_TOKENS[networkId as keyof typeof NATIVE_TOKENS];
    if (!nativeToken) return null;

    return {
      id: 0, // Will be set by caller
      contractAddress: '',
      name: nativeToken.name,
      symbol: nativeToken.symbol,
      balance: balanceInEth,
      decimals: nativeToken.decimals,
      networkId,
      networkName: getNetworkName(networkId),
      usdValue: 0, // Will be calculated later
      standard: TokenStandard.NATIVE,
    };
  } catch (error) {
    console.warn(`Failed to fetch native token balance for network ${networkId}:`, error);
    return null;
  }
};

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

export const getERC721Tokens = async (
  address: string,
  networkId: number
): Promise<TokenBalance[]> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    const nfts = await alchemy.nft.getNftsForOwner(address, {
      contractAddresses: [], // Get all NFTs
    });

    return nfts.ownedNfts.map((nft, index) => ({
      id: 0, // Will be set by caller
      contractAddress: nft.contract.address,
      name: nft.name || nft.contract.name || 'Unknown NFT',
      symbol: nft.contract.symbol || 'NFT',
      balance: 1, // NFTs have balance of 1
      decimals: 0,
      logo: (nft as any).media?.[0]?.thumbnail || (nft.contract as any).openSea?.imageUrl,
      networkId,
      networkName: getNetworkName(networkId),
      usdValue: 0, // NFT prices would need separate API
      standard: TokenStandard.ERC721,
      tokenId: nft.tokenId,
    }));
  } catch (error) {
    console.warn(`Failed to fetch ERC-721 tokens for network ${networkId}:`, error);
    return [];
  }
};

export const getERC1155Tokens = async (
  address: string,
  networkId: number
): Promise<TokenBalance[]> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    const nfts = await alchemy.nft.getNftsForOwner(address, {
      contractAddresses: [], // Get all NFTs
    });

    // Filter for ERC-1155 tokens
    const erc1155Nfts = nfts.ownedNfts.filter(nft => nft.contract.tokenType === 'ERC1155');

    return erc1155Nfts.flatMap(nft =>
      nft.balance ? [{
        id: 0,
        contractAddress: nft.contract.address,
        name: nft.name || nft.contract.name || 'Unknown ERC-1155',
        symbol: nft.contract.symbol || 'ERC1155',
        balance: parseInt(nft.balance.toString()),
        decimals: 0,
        logo: (nft as any).media?.[0]?.thumbnail || (nft.contract as any).openSea?.imageUrl,
        networkId,
        networkName: getNetworkName(networkId),
        usdValue: 0,
        standard: TokenStandard.ERC1155,
        tokenId: nft.tokenId,
      }] : []
    );
  } catch (error) {
    console.warn(`Failed to fetch ERC-1155 tokens for network ${networkId}:`, error);
    return [];
  }
};

export const validateCustomToken = async (
  contractAddress: string,
  networkId: number,
  standard: TokenStandard
): Promise<TokenMetadata | null> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    if (standard === TokenStandard.ERC20) {
      const metadata = await alchemy.core.getTokenMetadata(contractAddress);
      return {
        name: metadata.name || 'Unknown Token',
        symbol: metadata.symbol || 'UNK',
        decimals: metadata.decimals || 18,
        logo: metadata.logo || undefined,
        standard: TokenStandard.ERC20,
      };
    } else if (standard === TokenStandard.ERC721 || standard === TokenStandard.ERC1155) {
      const contract = await alchemy.nft.getContractMetadata(contractAddress);
      return {
        name: contract.name || 'Unknown NFT',
        symbol: contract.symbol || 'NFT',
        decimals: 0,
        logo: (contract as any).openSea?.imageUrl,
        standard,
      };
    }
  } catch (error) {
    console.warn(`Failed to validate custom token ${contractAddress}:`, error);
  }
  return null;
};

export const getTokenHolders = async (
  contractAddress: string,
  networkId: number
): Promise<number> => {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
      network: getAlchemyNetworkForChain(networkId),
    };
    const alchemy = new Alchemy(config);

    // This is a simplified implementation - in reality, you'd need more complex logic
    // or use additional APIs to get accurate holder counts
    const owners = await alchemy.nft.getOwnersForContract(contractAddress);
    return owners.owners.length;
  } catch (error) {
    console.warn(`Failed to get token holders for ${contractAddress}:`, error);
    return 0;
  }
};
