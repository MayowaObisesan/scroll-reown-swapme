# Wallet-Info SDK

A TypeScript/JavaScript SDK for integrating with the Wallet-Info multi-chain wallet platform.

## Installation

```bash
npm install @wallet-info/sdk
# or
yarn add @wallet-info/sdk
```

## Quick Start

```typescript
import { WalletInfoSDK } from '@wallet-info/sdk';

const sdk = new WalletInfoSDK({
  baseURL: 'https://api.wallet-info.com',
  apiKey: 'your-api-key' // Optional, depending on API requirements
});
```

## API Reference

### Portfolio Data

Get comprehensive portfolio information including token balances, values, and network breakdown.

```typescript
const portfolio = await sdk.getPortfolio('0x1234567890123456789012345678901234567890');

// Get portfolio for specific network
const ethPortfolio = await sdk.getPortfolio('0x123...', 1); // Ethereum Mainnet
```

**Response:**
```typescript
{
  address: "0x123...",
  totalValue: 15420.50,
  tokenCount: 12,
  networkBreakdown: {
    "Ethereum": 8920.30,
    "Base": 4500.20,
    "Scroll": 2000.00
  },
  tokens: [
    {
      id: 1,
      contractAddress: "0x...",
      name: "Ethereum",
      symbol: "ETH",
      balance: 2.5,
      decimals: 18,
      networkId: 1,
      networkName: "Ethereum",
      usdValue: 4250.00,
      standard: "native"
    }
    // ... more tokens
  ],
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### Transaction History

Retrieve transaction history with filtering and pagination.

```typescript
const transactions = await sdk.getTransactions('0x123...', {
  limit: 50,
  offset: 0,
  networkId: 1 // Optional: filter by network
});
```

**Response:**
```typescript
{
  address: "0x123...",
  transactions: [
    {
      hash: "0xabc...",
      from: "0x123...",
      to: "0x456...",
      value: "1000000000000000000",
      timestamp: 1705312200000,
      status: "confirmed",
      type: "transfer",
      networkId: 1,
      networkName: "Ethereum",
      gasUsed: "21000",
      gasPrice: "20000000000",
      blockNumber: "18500000",
      category: "send"
    }
  ],
  total: 150,
  limit: 50,
  offset: 0,
  hasMore: true
}
```

### Webhook Integration

Set up webhooks to receive real-time notifications about transactions and events.

```typescript
// Register a webhook
const { webhookId } = await sdk.registerWebhook({
  url: 'https://your-app.com/webhook',
  secret: 'your-webhook-secret', // Optional
  events: ['transaction.confirmed', 'transaction.failed'],
  addresses: ['0x123...'], // Optional: filter by addresses
  networks: [1, 8453] // Optional: filter by network IDs
});

// Test the webhook
const testResult = await sdk.testWebhook(webhookId);

// Unregister when done
await sdk.unregisterWebhook(webhookId);
```

**Webhook Payload:**
```typescript
{
  event: "transaction.confirmed",
  data: {
    hash: "0xabc...",
    from: "0x123...",
    to: "0x456...",
    value: "1000000000000000000",
    networkId: 1,
    // ... other transaction data
  },
  webhookId: "wh_123...",
  timestamp: "2024-01-15T10:30:00Z"
}
```

### Webhook Management

Monitor and manage your webhooks.

```typescript
// Get all webhook registrations
const registrations = await sdk.getWebhookRegistrations();

// Get delivery logs
const logs = await sdk.getWebhookLogs();
```

## Error Handling

The SDK throws errors for API failures:

```typescript
try {
  const portfolio = await sdk.getPortfolio(address);
} catch (error) {
  console.error('Failed to get portfolio:', error.message);
}
```

## Configuration

```typescript
const sdk = new WalletInfoSDK({
  baseURL: 'https://api.wallet-info.com', // Required
  apiKey: 'your-api-key', // Optional
  timeout: 30000 // Optional, default 30 seconds
});
```

## Supported Networks

- Ethereum Mainnet (1)
- Ethereum Sepolia (11155111)
- Ethereum Goerli (5)
- Base Mainnet (8453)
- Base Sepolia (84532)
- Scroll Mainnet (534352)
- Scroll Sepolia (534351)

## License

MIT
