export interface TokenBalance {
  id: number;
  contractAddress: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  logo?: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
}
