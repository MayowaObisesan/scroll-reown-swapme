/**
 * Wallet-Info SDK
 *
 * A TypeScript/JavaScript SDK for integrating with the Wallet-Info multi-chain wallet platform.
 *
 * @example
 * ```typescript
 * import { WalletInfoSDK } from '@wallet-info/sdk';
 *
 * const sdk = new WalletInfoSDK({
 *   baseURL: 'https://api.wallet-info.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Get portfolio data
 * const portfolio = await sdk.getPortfolio('0x123...');
 *
 * // Get transactions
 * const transactions = await sdk.getTransactions('0x123...');
 *
 * // Register webhook
 * await sdk.registerWebhook({
 *   url: 'https://your-app.com/webhook',
 *   events: ['transaction.confirmed'],
 *   addresses: ['0x123...']
 * });
 * ```
 */

export interface SDKConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

export interface PortfolioData {
  address: string;
  totalValue: number;
  tokenCount: number;
  networkBreakdown: Record<string, number>;
  tokens: Array<{
    id: number;
    contractAddress: string;
    name: string;
    symbol: string;
    balance: number;
    decimals: number;
    logo?: string;
    networkId: number;
    networkName: string;
    usdValue?: number;
    standard: string;
    tokenId?: string;
  }>;
  lastUpdated: string;
}

export interface TransactionData {
  address: string;
  transactions: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    status: string;
    type: string;
    networkId: number;
    networkName: string;
    gasUsed?: string;
    gasPrice?: string;
    blockNumber?: string;
    category: string;
  }>;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface WebhookRegistration {
  url: string;
  secret?: string;
  events: string[];
  addresses?: string[];
  networks?: number[];
}

export class WalletInfoSDK {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Get portfolio data for an address
   */
  async getPortfolio(
    address: string,
    networkId?: number
  ): Promise<PortfolioData> {
    const params = new URLSearchParams({ address });
    if (networkId) params.append('networkId', networkId.toString());

    const response = await this.request(`/api/portfolio?${params}`);
    return response;
  }

  /**
   * Get transaction history for an address
   */
  async getTransactions(
    address: string,
    options: {
      networkId?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TransactionData> {
    const params = new URLSearchParams({ address });
    if (options.networkId) params.append('networkId', options.networkId.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await this.request(`/api/transactions?${params}`);
    return response;
  }

  /**
   * Register a webhook for notifications
   */
  async registerWebhook(registration: WebhookRegistration): Promise<{ webhookId: string }> {
    const response = await this.request('/api/webhooks/transactions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'register',
        ...registration,
      }),
    });
    return response;
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.request('/api/webhooks/transactions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'unregister',
        webhookId,
      }),
    });
  }

  /**
   * Test a webhook
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request('/api/webhooks/transactions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'test',
        webhookId,
      }),
    });
    return response;
  }

  /**
   * Get webhook registrations
   */
  async getWebhookRegistrations(): Promise<Array<{
    id: string;
    url: string;
    events: string[];
    addresses: string[];
    networks: number[];
    createdAt: number;
    lastTriggered?: number;
  }>> {
    const response = await this.request('/api/webhooks/transactions?action=registrations');
    return response.registrations;
  }

  /**
   * Get webhook delivery logs
   */
  async getWebhookLogs(): Promise<Array<{
    id: string;
    webhookId: string;
    event: string;
    payload: any;
    status: 'success' | 'failed';
    timestamp: number;
    error?: string;
  }>> {
    const response = await this.request('/api/webhooks/transactions?action=logs');
    return response.logs;
  }

  /**
   * Make an HTTP request to the API
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.config.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Handle headers properly - could be Headers object or plain object
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }
}

// Default export
export default WalletInfoSDK;

// Helper function for common SDK instantiation
export function createWalletInfoSDK(config: SDKConfig): WalletInfoSDK {
  return new WalletInfoSDK(config);
}
