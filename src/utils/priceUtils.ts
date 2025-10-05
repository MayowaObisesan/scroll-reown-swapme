interface TokenPrice {
  symbol: string;
  price: number;
  lastUpdated: number;
}

// Simple in-memory cache for prices
const priceCache: { [key: string]: TokenPrice } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getTokenPrice = async (symbol: string): Promise<number> => {
  const cacheKey = symbol.toLowerCase();

  // Check cache first
  if (priceCache[cacheKey] && Date.now() - priceCache[cacheKey].lastUpdated < CACHE_DURATION) {
    return priceCache[cacheKey].price;
  }

  try {
    // Using CoinGecko API for price data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(symbol)}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${symbol}`);
    }

    const data = await response.json();
    const coinGeckoId = getCoinGeckoId(symbol);
    const price = data[coinGeckoId]?.usd || 0;

    // Cache the result
    priceCache[cacheKey] = {
      symbol,
      price,
      lastUpdated: Date.now(),
    };

    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${symbol}:`, error);
    return 0; // Return 0 if price fetch fails
  }
};

// Map common token symbols to CoinGecko IDs
const getCoinGeckoId = (symbol: string): string => {
  const symbolToId: { [key: string]: string } = {
    ETH: 'ethereum',
    WETH: 'weth',
    USDC: 'usd-coin',
    USDT: 'tether',
    DAI: 'dai',
    WBTC: 'wrapped-bitcoin',
    UNI: 'uniswap',
    LINK: 'chainlink',
    AAVE: 'aave',
    SNX: 'synthetix-network-token',
    COMP: 'compound-governance-token',
    MKR: 'maker',
    YFI: 'yearn-finance',
    SUSHI: 'sushi',
    CRV: 'curve-dao-token',
    // Base ecosystem
    'BASE': 'ethereum', // Base uses ETH
    // Scroll ecosystem
    'SCRL': 'scroll', // Assuming Scroll has a token
    // Add more mappings as needed
  };

  return symbolToId[symbol.toUpperCase()] || symbol.toLowerCase();
};

export const getMultipleTokenPrices = async (symbols: string[]): Promise<{ [key: string]: number }> => {
  const uniqueSymbols = [...new Set(symbols)];
  const prices: { [key: string]: number } = {};

  // Batch fetch prices
  const coinGeckoIds = uniqueSymbols.map(symbol => getCoinGeckoId(symbol)).filter(id => id);

  if (coinGeckoIds.length === 0) {
    return prices;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }

    const data = await response.json();

    uniqueSymbols.forEach(symbol => {
      const coinGeckoId = getCoinGeckoId(symbol);
      const price = data[coinGeckoId]?.usd || 0;
      prices[symbol] = price;

      // Update cache
      priceCache[symbol.toLowerCase()] = {
        symbol,
        price,
        lastUpdated: Date.now(),
      };
    });
  } catch (error) {
    console.warn('Failed to fetch multiple prices:', error);
  }

  return prices;
};
