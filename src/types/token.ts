export enum TokenStandard {
  NATIVE = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
}

export interface TokenBalance {
  id: number;
  contractAddress: string; // Empty string for native tokens
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  logo?: string;
  networkId: number;
  networkName: string;
  usdValue?: number;
  standard: TokenStandard;
  tokenId?: string; // For NFTs
  isYieldBearing?: boolean;
  yieldApy?: number;
  lastTransfer?: Date;
  transferCount?: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  standard: TokenStandard;
  totalSupply?: string;
  holders?: number;
}

export interface CustomToken {
  contractAddress: string;
  networkId: number;
  standard: TokenStandard;
  name?: string;
  symbol?: string;
  decimals?: number;
  logo?: string;
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  tokenAddress: string;
  tokenSymbol: string;
  category: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'yield' | 'other';
  networkId: number;
}
