# API Documentation

This document outlines the API integrations and usage patterns for the SwapMe Web3 wallet management application.

## Alchemy SDK Integration

### Token Balance Fetching

The application uses Alchemy SDK to fetch ERC-20 token balances for connected wallets.

```typescript
import { Alchemy, Network } from 'alchemy-sdk';

const config = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
  network: getAlchemyNetworkForChain(chainId),
};
const alchemy = new Alchemy(config);

// Get token balances
const balances = await alchemy.core.getTokenBalances(address);

// Get token metadata
const metadata = await alchemy.core.getTokenMetadata(contractAddress);
```

### Network Configuration

The app supports dynamic network detection based on the connected wallet's chain ID:

- Scroll Mainnet (534352) → ETH_MAINNET (placeholder)
- Scroll Sepolia (534351) → ETH_SEPOLIA

## Wagmi Integration

### Wallet Connection

```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const { address, isConnected } = useAccount();
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();
```

### Custom Hooks

The application provides custom hooks for common Web3 operations:

- `useWallet()` - Wallet connection state and actions
- `useTokenBalances()` - Token balance fetching with React Query
- `useTokenActions()` - Token transfer operations (placeholder)

## React Query Integration

Token balances are cached using React Query with the following configuration:

```typescript
{
  queryKey: ['tokenBalances', address, chainId],
  staleTime: 30000, // 30 seconds
  refetchOnWindowFocus: false,
}
```

## Error Handling

Web3 operations include comprehensive error handling:

- `handleWeb3Error()` - User-friendly error messages
- `withRetry()` - Automatic retry logic for failed requests

## State Management

Global state is managed using Zustand:

```typescript
import { useTokenStore } from '../stores/useTokenStore';

const { tokens, loading, error, setTokens } = useTokenStore();
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_PROJECT_ID` - Reown AppKit project ID
- `NEXT_PUBLIC_ALCHEMY_KEY` - Alchemy API key
