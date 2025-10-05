import { TokenBalance } from '../types/token';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class TokenBalanceCache {
  private cache = new Map<string, { data: TokenBalance[]; timestamp: number }>();

  get(address: string): TokenBalance[] | null {
    const cached = this.cache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  set(address: string, data: TokenBalance[]): void {
    this.cache.set(address, { data, timestamp: Date.now() });
  }

  clear(address?: string): void {
    if (address) {
      this.cache.delete(address);
    } else {
      this.cache.clear();
    }
  }
}

export const tokenCache = new TokenBalanceCache();
