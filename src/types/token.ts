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

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum TransactionType {
  TRANSFER = 'transfer',
  SWAP = 'swap',
  BRIDGE = 'bridge',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM = 'claim',
  APPROVE = 'approve',
  CONTRACT_INTERACTION = 'contract_interaction',
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  gasLimit?: string;
  timestamp: number;
  blockNumber?: number;
  status: TransactionStatus;
  type: TransactionType;
  networkId: number;
  networkName: string;
  description?: string;
  tokens?: {
    from?: {
      address: string;
      symbol: string;
      amount: string;
    };
    to?: {
      address: string;
      symbol: string;
      amount: string;
    };
  };
  fee?: {
    amount: string;
    symbol: string;
    usdValue?: number;
  };
  category: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'yield' | 'bridge' | 'other';
}

export interface TransactionBatch {
  id: string;
  transactions: Transaction[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'scheduled';
  createdAt: number;
  executedAt?: number;
  scheduledFor?: number;
  description?: string;
  networks: number[]; // Array of network IDs involved in the batch
}

export interface TransactionTemplate {
  id: string;
  name: string;
  description?: string;
  type: TransactionType;
  networkId: number;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
}

export interface GasAnalytics {
  networkId: number;
  averageGasPrice: string;
  medianGasPrice: string;
  suggestedGasPrice: string;
  gasUsed: string;
  efficiency: 'low' | 'medium' | 'high';
  recommendations: string[];
}
